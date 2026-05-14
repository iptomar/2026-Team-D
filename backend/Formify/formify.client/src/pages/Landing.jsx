import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import mockup1 from '../assets/mockup-1.png';
import mockup2 from '../assets/mockup-2.png';

const FALLBACK_STATS = { total: 0, published: 0, drafts: 0 };

export default function Landing() {
    const [stats, setStats] = useState(FALLBACK_STATS);
    const [statsLoaded, setStatsLoaded] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:5208/api/Forms', {
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error('Erro ao obter formulários');

                const data = await response.json();
                const total = Array.isArray(data) ? data.length : 0;
                const drafts = Array.isArray(data)
                    ? data.filter(f => (f.statusDrafted ?? f.StatusDrafted) === true).length
                    : 0;
                const published = total - drafts;

                setStats({ total, published, drafts });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.warn('Stats indisponíveis, a usar fallback.', error);
                }
            } finally {
                setStatsLoaded(true);
            }
        };

        fetchStats();
        return () => controller.abort();
    }, []);

    const displayValue = (value) => {
        if (!statsLoaded) return '...';
        return value.toString();
    };

    return (
        <div className="flex flex-col">
            {/* ── Hero ───────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-white via-accent-bg to-white">
                <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
                    <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
                        <span className="inline-block w-fit self-center rounded-full border border-accent-border bg-white px-4 py-1 text-sm font-semibold text-accent lg:self-start">
                            Instituto Politécnico de Tomar
                        </span>
                        <h1 className="text-4xl font-bold leading-tight text-text-h sm:text-5xl lg:text-6xl">
                            Formulários institucionais{' '}
                            <span className="text-accent">simples</span> e centralizados
                        </h1>
                        <p className="text-lg text-text sm:text-xl">
                            Cria, partilha e analisa formulários do IPT num só lugar.
                            Pensado para docentes, funcionários e administração.
                        </p>

                        <div className="flex flex-col items-center gap-4 pt-2 sm:flex-row sm:justify-center lg:justify-start">
                            <Link
                                to="/register"
                                className="w-full rounded-lg bg-accent px-8 py-3 text-center text-base font-semibold text-white shadow-custom transition-transform hover:-translate-y-0.5 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 sm:w-auto"
                            >
                                Criar conta
                            </Link>
                            <Link
                                to="/login"
                                className="w-full rounded-lg border-2 border-accent bg-white px-8 py-3 text-center text-base font-semibold text-accent transition-colors hover:bg-accent-bg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 sm:w-auto"
                            >
                                Iniciar sessão
                            </Link>
                        </div>
                    </div>

                    <div className="relative flex items-center justify-center">
                        <div className="absolute -inset-4 rounded-3xl bg-accent/10 blur-3xl" aria-hidden="true" />
                        <img
                            src={mockup2}
                            alt="Pré-visualização da listagem de formulários do Formify"
                            className="relative w-full max-w-md rounded-xl border border-accent-border bg-white shadow-custom"
                        />
                    </div>
                </div>
            </section>

            {/* ── Stats cards ────────────────────────────────── */}
            <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-bold text-text-h">A plataforma em números</h2>
                        <p className="mt-2 text-text">Dados em tempo real do sistema</p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                        <StatCard
                            label="Formulários no total"
                            value={displayValue(stats.total)}
                            description="A crescer com a atividade do IPT"
                        />
                        <StatCard
                            label="Formulários publicados"
                            value={displayValue(stats.published)}
                            description="Disponíveis para preenchimento"
                            highlight
                        />
                        <StatCard
                            label="Em rascunho"
                            value={displayValue(stats.drafts)}
                            description="Em preparação pela administração"
                        />
                    </div>
                </div>
            </section>

            {/* ── Feature alternada com .º mockup ───────────── */}
            <section className="bg-accent-bg/30 px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
                    <div className="order-2 flex items-center justify-center lg:order-1">
                        <div className="relative">
                            <div className="absolute -inset-4 rounded-3xl bg-accent/10 blur-3xl" aria-hidden="true" />
                            <img
                                src={mockup1}
                                alt="Pré-visualização do editor de formulários do Formify"
                                className="relative w-full max-w-md rounded-xl border border-accent-border bg-white shadow-custom"
                            />
                        </div>
                    </div>

                    <div className="order-1 space-y-6 lg:order-2">
                        <h2 className="text-3xl font-bold text-text-h sm:text-4xl">
                            Um editor pensado para o teu trabalho
                        </h2>
                        <p className="text-lg text-text">
                            Cria perguntas de escolha múltipla, tabelas, respostas
                            abertas e muito mais. Define o público-alvo (docentes,
                            funcionários) e publica quando estiver pronto.
                        </p>
                        <ul className="space-y-3 text-text">
                            <FeatureBullet>Editor visual com pré-visualização imediata</FeatureBullet>
                            <FeatureBullet>Rascunhos guardados antes de publicar</FeatureBullet>
                            <FeatureBullet>Filtragem por cargo e pesquisa rápida</FeatureBullet>
                            <FeatureBullet>Interface responsiva, pronta para qualquer dispositivo</FeatureBullet>
                        </ul>
                    </div>
                </div>
            </section>

            {/* ── 3 destaques ────────────────────────────────── */}
            <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-bold text-text-h">Tudo o que precisas</h2>
                        <p className="mt-2 text-text">Três passos para uma gestão de formulários sem fricção</p>
                    </div>

                    <div className="grid gap-8 sm:grid-cols-3">
                        <FeatureCard
                            title="Cria"
                            description="Desenha formulários com diferentes tipos de perguntas de forma rápida e intuitiva."
                        />
                        <FeatureCard
                            title="Partilha"
                            description="Disponibiliza formulários a docentes e funcionários consoante o cargo."
                        />
                        <FeatureCard
                            title="Analisa"
                            description="Consulta as respostas e acompanha a evolução dos preenchimentos."
                        />
                    </div>
                </div>
            </section>

            {/* ── CTA final ──────────────────────────────────── */}
            <section className="bg-gradient-to-r from-accent to-emerald-700 px-4 py-16 text-white sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
                    <h2 className="text-3xl font-bold text-white sm:text-4xl">
                        Pronto para começar?
                    </h2>
                    <p className="max-w-2xl text-lg text-white/90">
                        Cria a tua conta e começa hoje a gerir os formulários do IPT
                        de forma simples e organizada.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                            to="/register"
                            className="rounded-lg bg-white px-8 py-3 text-base font-semibold text-accent shadow-sm transition-transform hover:-translate-y-0.5"
                        >
                            Criar conta
                        </Link>
                        <Link
                            to="/login"
                            className="rounded-lg border-2 border-white/80 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
                        >
                            Iniciar sessão
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

function StatCard({ label, value, description, highlight = false }) {
    return (
        <div
            className={`rounded-2xl border p-6 text-center transition-transform hover:-translate-y-1 ${
                highlight
                    ? 'border-accent bg-accent-bg shadow-custom'
                    : 'border-accent-border bg-white shadow-sm'
            }`}
        >
            <p className="text-5xl font-bold text-accent">{value}</p>
            <p className="mt-3 text-base font-semibold text-text-h">{label}</p>
            <p className="mt-1 text-sm text-text">{description}</p>
        </div>
    );
}

function FeatureCard({ title, description }) {
    return (
        <div className="rounded-2xl border border-accent-border bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-custom">
            <h3 className="mb-3 text-xl font-bold text-text-h">{title}</h3>
            <p className="text-sm text-text">{description}</p>
        </div>
    );
}

function FeatureBullet({ children }) {
    return (
        <li className="flex items-start gap-3">
            <span
                className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
                aria-hidden="true"
            >
                ✓
            </span>
            <span>{children}</span>
        </li>
    );
}
