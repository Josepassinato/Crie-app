import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LandingPageMarketingProps {
  onStart: () => void;
}

const LandingPageMarketing: React.FC<LandingPageMarketingProps> = ({ onStart }) => {
    const navigate = useNavigate();
    const [activeFaq, setActiveFaq] = useState<number | null>(null);

    const features = [
        {
            icon: '🎨',
            title: 'Criação de Conteúdo com IA',
            description: 'Posts, imagens e vídeos profissionais em segundos. Pare de perder horas criando conteúdo manualmente.'
        },
        {
            icon: '🎵',
            title: 'Jingles Comerciais',
            description: 'Música profissional para sua marca em 6 idiomas. Sem estúdio, sem músicos, sem complicação.'
        },
        {
            icon: '🎬',
            title: 'Videoclipes Automáticos',
            description: 'Vídeos publicitários em minutos. Do roteiro ao vídeo final, tudo com IA de última geração.'
        },
        {
            icon: '📊',
            title: 'Análise de Performance',
            description: 'Descubra o que funciona nas suas redes sociais. Dados reais, insights acionáveis, resultados garantidos.'
        },
        {
            icon: '🎯',
            title: 'Planejamento de Campanhas',
            description: 'Estratégias completas de marketing. Do público-alvo ao cronograma de posts, tudo pronto.'
        },
        {
            icon: '🎤',
            title: 'Agente de Voz com IA',
            description: 'Converse com IA e crie conteúdo por voz. O futuro do marketing digital já chegou.'
        }
    ];

    const testimonials = [
        {
            name: 'Maria Silva',
            role: 'CEO, Digital Agência',
            text: 'Reduzimos 70% do tempo de criação de conteúdo. Nossos clientes estão impressionados com a qualidade!',
            rating: 5
        },
        {
            name: 'João Santos',
            role: 'Gestor de Marketing',
            text: 'Em 1 mês criamos mais de 300 posts. Impossível sem o Crie-App. ROI incrível!',
            rating: 5
        },
        {
            name: 'Ana Costa',
            role: 'Influenciadora',
            text: 'Finalmente consigo focar no que importa: estratégia. A IA cuida da criação. Simplesmente perfeito.',
            rating: 5
        }
    ];

    const faqs = [
        {
            question: 'Preciso ter conhecimento técnico?',
            answer: 'Absolutamente não! Nossa interface é intuitiva. Se você sabe usar WhatsApp, sabe usar o Crie-App.'
        },
        {
            question: 'Como funciona o sistema de tokens?',
            answer: 'Cada ação (criar post, gerar vídeo) consome tokens. Você compra pacotes e usa quando quiser. Sem mensalidade fixa!'
        },
        {
            question: 'Posso cancelar a qualquer momento?',
            answer: 'Sim! Não há contratos ou fidelidade. Use seus tokens quando quiser, sem pressão.'
        },
        {
            question: 'A IA cria conteúdo original?',
            answer: 'Sim! Todo conteúdo é único e criado especificamente para sua marca. Nada de templates genéricos.'
        },
        {
            question: 'Funciona para qualquer nicho?',
            answer: 'Sim! Atendemos desde restaurantes até advogados, de e-commerce a coaches. Qualquer nicho funciona.'
        }
    ];

    const pricingPlans = [
        { name: 'STARTER', tokens: '200', price: 'R$ 20', ideal: 'Iniciantes', highlight: false },
        { name: 'PRO', tokens: '500', price: 'R$ 45', ideal: 'Pequenas Empresas', highlight: false },
        { name: 'BUSINESS', tokens: '1.200', price: 'R$ 99', ideal: 'Agências', highlight: true },
        { name: 'MEGA', tokens: '3.000', price: 'R$ 220', ideal: 'Escala', highlight: false },
        { name: 'ENTERPRISE', tokens: '10.000', price: 'R$ 650', ideal: 'Corporativo', highlight: false }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            {/* Header/Nav */}
            <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-lg z-50 border-b border-purple-500/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                                Crie-App
                            </span>
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <a href="#funcionalidades" className="hover:text-orange-400 transition">Funcionalidades</a>
                            <a href="#precos" className="hover:text-orange-400 transition">Preços</a>
                            <a href="#depoimentos" className="hover:text-orange-400 transition">Depoimentos</a>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full font-semibold hover:scale-105 transition-transform"
                        >
                            Entrar
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-block mb-4 px-4 py-2 bg-orange-500/20 rounded-full border border-orange-500/50">
                        <span className="text-orange-400 font-semibold">🔥 +1.000 empresas já transformaram seu marketing</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                        Pare de Perder Tempo<br />
                        <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                            Crie Marketing com IA
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                        A plataforma completa que cria posts, vídeos, jingles e estratégias de marketing em <span className="text-orange-400 font-bold">segundos</span>. 
                        Enquanto seus concorrentes ainda estão planejando, você já publicou.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full text-lg font-bold hover:scale-105 transition-transform shadow-2xl"
                        >
                            Começar Grátis Agora 🚀
                        </button>
                        <button
                            onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-full text-lg font-semibold hover:bg-white/20 transition border border-white/20"
                        >
                            Ver Preços
                        </button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                            <span className="text-green-400 text-xl">✓</span>
                            <span>20 tokens grátis no cadastro</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-400 text-xl">✓</span>
                            <span>Sem cartão de crédito</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-400 text-xl">✓</span>
                            <span>Cancele quando quiser</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem/Solution Section */}
            <section className="py-20 px-4 bg-slate-900/50">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
                            <h3 className="text-3xl font-bold mb-6 text-red-400">❌ Sem o Crie-App</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 text-xl">✗</span>
                                    <span>Horas perdidas criando posts manualmente</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 text-xl">✗</span>
                                    <span>R$ 5.000+ por mês em designers e editores</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 text-xl">✗</span>
                                    <span>Conteúdo inconsistente e sem estratégia</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 text-xl">✗</span>
                                    <span>Dependência de freelancers e prazos</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 text-xl">✗</span>
                                    <span>Resultados imprevisíveis e demorados</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8">
                            <h3 className="text-3xl font-bold mb-6 text-green-400">✓ Com o Crie-App</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 text-xl">✓</span>
                                    <span>Conteúdo profissional em <strong>segundos</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 text-xl">✓</span>
                                    <span>Economize <strong>95%</strong> em custos de marketing</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 text-xl">✓</span>
                                    <span>Estratégias testadas e comprovadas pela IA</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 text-xl">✓</span>
                                    <span>Total controle e autonomia criativa</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 text-xl">✓</span>
                                    <span>Resultados mensuráveis e <strong>garantidos</strong></span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="funcionalidades" className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Tudo que Você Precisa em <span className="text-orange-400">Um Lugar</span>
                        </h2>
                        <p className="text-xl text-gray-400">
                            6 ferramentas poderosas que substituem uma agência inteira
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 hover:border-orange-500/50 transition-all hover:scale-105"
                            >
                                <div className="text-5xl mb-4">{feature.icon}</div>
                                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof Section */}
            <section id="depoimentos" className="py-20 px-4 bg-slate-900/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Empresas que Já <span className="text-orange-400">Transformaram</span> Seu Marketing
                        </h2>
                        <div className="flex justify-center items-center gap-2 text-yellow-400 text-2xl mb-2">
                            {'★'.repeat(5)}
                        </div>
                        <p className="text-xl text-gray-400">Avaliação média: 4.9/5 baseado em 847 avaliações</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20"
                            >
                                <div className="flex gap-1 text-yellow-400 mb-4">
                                    {'★'.repeat(testimonial.rating)}
                                </div>
                                <p className="text-gray-300 mb-6 italic">"{testimonial.text}"</p>
                                <div>
                                    <p className="font-bold">{testimonial.name}</p>
                                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="precos" className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Preços <span className="text-orange-400">Transparentes</span>
                        </h2>
                        <p className="text-xl text-gray-400">
                            Pague apenas pelo que usar. Sem mensalidades, sem surpresas.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {pricingPlans.map((plan, index) => (
                            <div
                                key={index}
                                className={`relative bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
                                    plan.highlight
                                        ? 'border-orange-500 shadow-2xl shadow-orange-500/20'
                                        : 'border-purple-500/20'
                                }`}
                            >
                                {plan.highlight && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-yellow-500 px-4 py-1 rounded-full text-sm font-bold">
                                        POPULAR
                                    </div>
                                )}
                                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-3xl font-extrabold mb-2 text-orange-400">{plan.price}</p>
                                <p className="text-gray-400 text-sm mb-4">{plan.tokens} tokens</p>
                                <p className="text-xs text-gray-500 mb-6">Ideal para: {plan.ideal}</p>
                                <button
                                    onClick={() => navigate('/login')}
                                    className={`w-full py-2 rounded-lg font-semibold transition ${
                                        plan.highlight
                                            ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                                            : 'bg-slate-700 hover:bg-slate-600'
                                    }`}
                                >
                                    Começar Agora
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-12">
                        <p className="text-gray-400">
                            💳 Aceitamos cartões internacionais • 🔒 Pagamento 100% seguro via Stripe
                        </p>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 px-4 bg-slate-900/50">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Perguntas <span className="text-orange-400">Frequentes</span>
                        </h2>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden"
                            >
                                <button
                                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-slate-700/30 transition"
                                >
                                    <span className="font-semibold text-lg">{faq.question}</span>
                                    <span className="text-2xl">{activeFaq === index ? '−' : '+'}</span>
                                </button>
                                {activeFaq === index && (
                                    <div className="px-6 pb-4 text-gray-400">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 backdrop-blur-sm p-12 rounded-3xl border-2 border-orange-500/50">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Pronto Para Revolucionar Seu Marketing?
                        </h2>
                        <p className="text-xl text-gray-300 mb-8">
                            Junte-se a +1.000 empresas que já economizam tempo e dinheiro com IA
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-12 py-5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-2xl"
                        >
                            Começar Grátis Agora 🚀
                        </button>
                        <p className="text-sm text-gray-400 mt-4">
                            20 tokens grátis • Sem cartão de crédito • Cancele quando quiser
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 bg-slate-900 border-t border-purple-500/20">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-gray-400">
                        © 2025 Crie-App. Todos os direitos reservados.
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        Feito com ❤️ para revolucionar o marketing digital
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPageMarketing;
