"""
Kie.ai API Integration Service
Provides access to Suno (music) and Wan 2.5 (video) APIs
"""
import requests
import os
import time
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

KIE_AI_API_KEY = os.getenv("KIE_AI_API_KEY")
KIE_AI_BASE_URL = "https://api.kie.ai"

class KieAIService:
    def __init__(self):
        self.api_key = KIE_AI_API_KEY
        self.base_url = KIE_AI_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    # ========== SUNO MUSIC API ==========
    
    def generate_music(
        self,
        prompt: str,
        custom_mode: bool = False,
        instrumental: bool = False,
        model: str = "V3_5",
        callback_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate music using Suno API
        
        Args:
            prompt: Text description of the music
            custom_mode: Use custom mode for more control
            instrumental: Generate instrumental only (no vocals)
            model: Model version (V3_5, V4, V5)
            callback_url: URL to receive completion callback
            
        Returns:
            Dict with task_id and status
        """
        endpoint = f"{self.base_url}/api/v1/generate"
        
        payload = {
            "prompt": prompt,
            "customMode": custom_mode,
            "instrumental": instrumental,
            "model": model
        }
        
        # Callback URL is required by kie.ai
        if callback_url:
            payload["callBackUrl"] = callback_url
        else:
            # Use a placeholder if not provided (polling will be used instead)
            payload["callBackUrl"] = "https://placeholder.com/callback"
        
        response = requests.post(endpoint, json=payload, headers=self.headers)
        response.raise_for_status()
        
        return response.json()
    
    def get_music_details(self, task_id: str) -> Dict[str, Any]:
        """
        Get music generation task details
        
        Args:
            task_id: Task ID from generate_music
            
        Returns:
            Dict with status and audio URL when complete
        """
        endpoint = f"{self.base_url}/api/v1/generate/record-info"
        params = {"taskId": task_id}
        
        response = requests.get(endpoint, params=params, headers=self.headers)
        response.raise_for_status()
        
        return response.json()
    
    def extend_music(
        self,
        audio_url: str,
        prompt: str,
        continue_at: int = 0
    ) -> Dict[str, Any]:
        """
        Extend existing music track
        
        Args:
            audio_url: URL of the original audio
            prompt: Description for the extension
            continue_at: Time in seconds to continue from
            
        Returns:
            Dict with task_id
        """
        endpoint = f"{self.base_url}/api/v1/generate/extend"
        
        payload = {
            "audioUrl": audio_url,
            "prompt": prompt,
            "continueAt": continue_at
        }
        
        response = requests.post(endpoint, json=payload, headers=self.headers)
        response.raise_for_status()
        
        return response.json()
    
    # ========== WAN 2.5 VIDEO API ==========
    
    def generate_video(
        self,
        prompt: str,
        image_url: Optional[str] = None,
        duration: str = "5",
        resolution: str = "720p",
        aspect_ratio: str = "16:9",
        negative_prompt: Optional[str] = None,
        enable_prompt_expansion: bool = True,
        seed: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate video using Wan 2.5 API
        
        Args:
            prompt: Text description of the video scene
            image_url: Optional starting image URL (for image-to-video)
            duration: "5" or "10" seconds
            resolution: "720p" or "1080p" (10s can't be 1080p)
            aspect_ratio: "16:9", "9:16", or "1:1"
            negative_prompt: Content to exclude
            enable_prompt_expansion: Use LLM to improve prompt
            seed: Random seed for reproducibility
            
        Returns:
            Dict with generation_id
        """
        endpoint = f"{self.base_url}/wan-2-5/generate-video"
        
        payload = {
            "prompt": prompt,
            "duration": duration,
            "resolution": resolution,
            "aspect_ratio": aspect_ratio,
            "enable_prompt_expansion": enable_prompt_expansion
        }
        
        if image_url:
            payload["image_url"] = image_url
        
        if negative_prompt:
            payload["negative_prompt"] = negative_prompt
            
        if seed is not None:
            payload["seed"] = seed
        
        response = requests.post(endpoint, json=payload, headers=self.headers)
        response.raise_for_status()
        
        return response.json()
    
    def get_video_details(self, generation_id: str) -> Dict[str, Any]:
        """
        Get video generation task details
        
        Args:
            generation_id: Generation ID from generate_video
            
        Returns:
            Dict with status and video URL when complete
        """
        endpoint = f"{self.base_url}/wan-2-5/video-details"
        params = {"generationId": generation_id}
        
        response = requests.get(endpoint, params=params, headers=self.headers)
        response.raise_for_status()
        
        return response.json()
    
    def get_music_video_details(self, task_id: str) -> Dict[str, Any]:
        """
        Get music video generation details (Suno music with video)
        
        Args:
            task_id: Task ID from music generation
            
        Returns:
            Dict with video status and URL
        """
        endpoint = f"{self.base_url}/api/v1/video/details"
        params = {"taskId": task_id}
        
        response = requests.get(endpoint, params=params, headers=self.headers)
        response.raise_for_status()
        
        return response.json()
    
    # ========== HELPER METHODS ==========
    
    def wait_for_music(self, task_id: str, max_wait: int = 180, poll_interval: int = 5) -> Dict[str, Any]:
        """
        Wait for music generation to complete
        
        Args:
            task_id: Task ID to wait for
            max_wait: Maximum wait time in seconds
            poll_interval: Seconds between polls
            
        Returns:
            Final result dict with audio URL
        """
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            result = self.get_music_details(task_id)
            status = result.get("status", "").upper()
            
            if status == "SUCCESS":
                return result
            elif status in ["FAILED", "ERROR"]:
                raise Exception(f"Music generation failed: {result.get('error', 'Unknown error')}")
            
            time.sleep(poll_interval)
        
        raise TimeoutError(f"Music generation timed out after {max_wait} seconds")
    
    def wait_for_video(self, generation_id: str, max_wait: int = 300, poll_interval: int = 10) -> Dict[str, Any]:
        """
        Wait for video generation to complete
        
        Args:
            generation_id: Generation ID to wait for
            max_wait: Maximum wait time in seconds
            poll_interval: Seconds between polls
            
        Returns:
            Final result dict with video URL
        """
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            result = self.get_video_details(generation_id)
            status = result.get("status", "").lower()
            
            if status == "complete":
                return result
            elif status == "failed":
                raise Exception(f"Video generation failed: {result.get('error', 'Unknown error')}")
            
            time.sleep(poll_interval)
        
        raise TimeoutError(f"Video generation timed out after {max_wait} seconds")

# Create singleton instance
kie_service = KieAIService()
