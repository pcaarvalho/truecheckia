import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Zap, 
  BarChart3, 
  Users, 
  ArrowRight,
  Play,
  CheckCircle,
  Star,
  Globe,
  Target,
  Brain,
  Lock,
  Sparkles,
  TrendingUp,
  Award,
  ChevronDown,
  Menu,
  X,
  Download,
  Mail,
  Phone,
  MapPin,
  ExternalLink
} from 'lucide-react';
import ParticleBackground from '../components/landing/ParticleBackground';
import AnimatedCounter from '../components/landing/AnimatedCounter';
import DemoModal from '../components/landing/DemoModal';
import '../components/landing/LandingPage.css';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Detectar seção ativa
      const sections = ['hero', 'features', 'use-cases', 'testimonials', 'pricing', 'contact'];
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      
      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'IA Avançada',
      description: 'Algoritmos de deep learning treinados com milhões de amostras para máxima precisão.',
      gradient: 'from-blue-500 to-cyan-500',
      details: ['99.7% de precisão', 'Análise em tempo real', 'Suporte a 50+ idiomas']
    },
    {
      icon: Zap,
      title: 'Velocidade Relâmpago',
      description: 'Análise em tempo real com resultados instantâneos para qualquer tipo de conteúdo.',
      gradient: 'from-yellow-500 to-orange-500',
      details: ['< 15 segundos', 'Processamento paralelo', 'API otimizada']
    },
    {
      icon: Lock,
      title: 'Segurança Total',
      description: 'Criptografia end-to-end e política de zero logs para máxima privacidade.',
      gradient: 'from-green-500 to-emerald-500',
      details: ['Criptografia AES-256', 'Zero logs', 'Conformidade com GDPR']
    },
    {
      icon: Globe,
      title: 'Suporte Global',
      description: 'Detecção em 50+ idiomas com precisão cultural e contextual.',
      gradient: 'from-purple-500 to-pink-500',
      details: ['50+ idiomas', 'Contexto cultural', 'Suporte 24/7']
    }
  ];

  const useCases = [
    {
      title: 'Educação',
      description: 'Mantenha a integridade acadêmica detectando trabalhos gerados por IA automaticamente.',
      icon: '🎓',
      stats: '95% das universidades confiam',
      color: 'from-blue-600 to-blue-700',
      benefits: ['Verificação automática', 'Relatórios detalhados', 'Integração LMS']
    },
    {
      title: 'Jornalismo',
      description: 'Verifique a autenticidade de artigos e combata a desinformação em tempo real.',
      icon: '📰',
      stats: '200+ redações ativas',
      color: 'from-emerald-600 to-emerald-700',
      benefits: ['Verificação em tempo real', 'API para redações', 'Dashboard analítico']
    },
    {
      title: 'Empresas',
      description: 'Proteja sua marca verificando todo conteúdo antes da publicação.',
      icon: '🏢',
      stats: '85% de redução em riscos',
      color: 'from-purple-600 to-purple-700',
      benefits: ['Proteção de marca', 'Compliance automático', 'Alertas em tempo real']
    },
    {
      title: 'Pesquisa',
      description: 'Garanta originalidade em pesquisas acadêmicas e publicações científicas.',
      icon: '🔬',
      stats: '1M+ papers verificados',
      color: 'from-orange-600 to-orange-700',
      benefits: ['Verificação de papers', 'Plágio detectado', 'Relatórios acadêmicos']
    }
  ];

  const stats = [
    { number: 99.7, label: 'Precisão', subtext: 'Taxa de acerto', suffix: '%' },
    { number: 15, label: 'Velocidade', subtext: 'Tempo médio', suffix: 's' },
    { number: 2500000, label: 'Análises', subtext: 'Já realizadas', suffix: '+' },
    { number: 120, label: 'Países', subtext: 'Atendidos', suffix: '+' }
  ];

  const testimonials = [
    {
      name: 'Dr. Maria Silva',
      role: 'Diretora Acadêmica - USP',
      content: 'Revolucionou nossa forma de verificar trabalhos acadêmicos. A precisão é impressionante e a interface é intuitiva.',
      rating: 5,
      avatar: '👩‍🏫',
      company: 'Universidade de São Paulo'
    },
    {
      name: 'João Santos',
      role: 'Editor-chefe - Folha Digital',
      content: 'Ferramenta essencial para nossa redação. Detecta deepfakes e textos gerados com facilidade. Economizamos horas de verificação manual.',
      rating: 5,
      avatar: '👨‍💼',
      company: 'Folha Digital'
    },
    {
      name: 'Ana Costa',
      role: 'CMO - TechCorp',
      content: 'Protege nossa marca 24/7. Interface intuitiva e resultados confiáveis sempre. ROI impressionante em apenas 3 meses.',
      rating: 5,
      avatar: '👩‍💻',
      company: 'TechCorp'
    }
  ];

  const pricingPlans = [
    {
      name: 'Básico',
      price: 'R$ 29,99',
      period: '/mês',
      description: 'Perfeito para pequenas equipes',
      features: [
        '1.000 análises/mês',
        'Suporte por email',
        'API básica',
        'Relatórios básicos'
      ],
      popular: false,
      gradient: 'from-gray-500 to-gray-600'
    },
    {
      name: 'Profissional',
      price: 'R$ 59,99',
      period: '/mês',
      description: 'Ideal para empresas em crescimento',
      features: [
        '10.000 análises/mês',
        'Suporte prioritário',
        'API completa',
        'Relatórios avançados',
        'Integração customizada'
      ],
      popular: true,
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      name: 'Corporativo',
      price: 'Sob consulta',
      period: '',
      description: 'Para grandes organizações',
      features: [
        'Análises ilimitadas',
        'Suporte dedicado 24/7',
        'API enterprise',
        'Relatórios customizados',
        'Integração dedicada',
        'SLA garantido'
      ],
      popular: false,
      gradient: 'from-purple-500 to-pink-600'
    }
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="landing-page">
      {/* Background Particles */}
      <ParticleBackground />
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-800' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  TrueCheckIA
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {['hero', 'features', 'use-cases', 'testimonials', 'pricing', 'contact'].map((section) => (
                  <button
                    key={section}
                    onClick={() => scrollToSection(section)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSection === section
                        ? 'text-blue-400 bg-slate-800'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => scrollToSection('contact')}
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Contato
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Entrar
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-300 hover:text-white p-2 rounded-md"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {['hero', 'features', 'use-cases', 'testimonials', 'pricing', 'contact'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    activeSection === section
                      ? 'text-blue-400 bg-slate-800'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1).replace('-', ' ')}
                </button>
              ))}
              <div className="pt-4 pb-3 border-t border-slate-800">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Entrar
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Detecte IA
              </span>
              <br />
              <span className="text-white">Com Precisão</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Plataforma avançada de detecção de conteúdo gerado por inteligência artificial. 
              Proteja sua marca, mantenha a integridade acadêmica e combata a desinformação.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={() => setIsDemoOpen(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Play size={20} />
                <span>Ver Demonstração</span>
              </button>
              
              <button
                onClick={() => window.location.href = '/register'}
                className="btn-secondary flex items-center space-x-2"
              >
                <span>Começar Gratuitamente</span>
                <ArrowRight size={20} />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">
                    <AnimatedCounter 
                      end={stat.number} 
                      duration={2} 
                      suffix={stat.suffix}
                    />
                  </div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                  <div className="text-slate-500 text-xs">{stat.subtext}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Recursos */}
      <section id="features" className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Por que escolher a <span className="text-blue-400">TrueCheckIA</span>?
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Tecnologia de ponta combinada com interface intuitiva para máxima eficiência na detecção de IA.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card hover:transform hover:scale-105 transition-all duration-300"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6`}>
                  <feature.icon size={32} className="text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-300 mb-6">{feature.description}</p>
                
                <ul className="space-y-2">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center text-sm text-slate-400">
                      <CheckCircle size={16} className="text-green-400 mr-2 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Casos de Uso */}
      <section id="use-cases" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Casos de <span className="text-blue-400">Uso</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Aplicações práticas para diferentes setores e necessidades.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className={`card bg-gradient-to-br ${useCase.color} hover:transform hover:scale-105 transition-all duration-300`}
              >
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">{useCase.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">{useCase.title}</h3>
                    <p className="text-slate-200 mb-4">{useCase.description}</p>
                    <div className="text-blue-200 font-semibold mb-4">{useCase.stats}</div>
                    
                    <ul className="space-y-2">
                      {useCase.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center text-sm text-slate-200">
                          <CheckCircle size={16} className="text-green-300 mr-2 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Depoimentos */}
      <section id="testimonials" className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              O que nossos <span className="text-blue-400">clientes</span> dizem
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Depoimentos de quem já transformou seus processos com a TrueCheckIA.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card hover:transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="text-3xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{testimonial.name}</h4>
                    <p className="text-slate-400 text-sm">{testimonial.role}</p>
                    <p className="text-blue-400 text-sm">{testimonial.company}</p>
                  </div>
                </div>
                
                <p className="text-slate-300 mb-4">{testimonial.content}</p>
                
                <div className="flex items-center">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Preços */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Planos e <span className="text-blue-400">Preços</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Escolha o plano ideal para suas necessidades. Todos incluem suporte e atualizações.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`card relative ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''} hover:transform hover:scale-105 transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Mais Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-400 ml-1">{plan.period}</span>
                  </div>
                  <p className="text-slate-400 mt-2">{plan.description}</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-slate-300">
                      <CheckCircle size={20} className="text-green-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => window.location.href = '/register'}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  Começar Agora
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Contato */}
      <section id="contact" className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Entre em <span className="text-blue-400">Contato</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Pronto para transformar sua organização? Fale conosco!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Informações de Contato</h3>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Mail size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Email</h4>
                    <p className="text-slate-400">contato@truecheckia.com</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <Phone size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Telefone</h4>
                    <p className="text-slate-400">+55 (11) 99999-9999</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <MapPin size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Endereço</h4>
                    <p className="text-slate-400">São Paulo, SP - Brasil</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Envie uma Mensagem</h3>
              
              <form className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    className="input w-full"
                  />
                </div>
                
                <div>
                  <input
                    type="email"
                    placeholder="Seu email"
                    className="input w-full"
                  />
                </div>
                
                <div>
                  <textarea
                    placeholder="Sua mensagem"
                    rows={4}
                    className="input w-full resize-none"
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="btn-primary w-full"
                >
                  Enviar Mensagem
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                TrueCheckIA
              </h3>
              <p className="text-slate-400 mb-4">
                Plataforma líder em detecção de conteúdo gerado por IA.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <ExternalLink size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Preços</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Documentação</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Carreiras</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Imprensa</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Comunidade</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <p className="text-slate-400">
              © 2024 TrueCheckIA. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </div>
  );
};

export default LandingPage; 