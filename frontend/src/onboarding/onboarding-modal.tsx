import { useState, useEffect } from 'react';

const STORAGE_KEY = 'openall_onboarding_v1';

const slides = [
    {
        image: 'onboarding/01-main-screen.png',
        title: 'Welcome to openall',
        body: 'openall is a new kind of desktop — there are no apps to install. Every tool you need is built on demand by an AI, right here, as a floating window on your screen.',
    },
    {
        image: 'onboarding/03-config-modal.png',
        title: 'Connect your AI provider',
        body: 'Click the gear icon in the sidebar to add your API key. OpenRouter gives you access to dozens of models with a single key and is free to start.',
    },
    {
        image: 'onboarding/02-chat-expanded.png',
        title: 'Just type what you need',
        body: 'Describe a tool, dashboard, or task in plain language and press Cmd+Enter. The AI reads your request and decides what to build — no commands, no code.',
    },
    {
        image: 'onboarding/07-draggable-window.png',
        title: 'Your tools appear as windows',
        body: 'The AI generates a live, interactive interface and opens it as a draggable window. Buttons, forms, and tables all work — click inside and the AI responds in real time.',
    },
    {
        image: 'onboarding/10-pinned-app-sidebar.png',
        title: 'Pin your favourite apps',
        body: 'Pin any window to the sidebar so it survives across sessions. Reopening a pinned app restores its last UI instantly and quietly refreshes the data in the background.',
    },
    {
        image: 'onboarding/06-launcher-overlay.png',
        title: 'Launch anything in one click',
        body: 'Use the magnifier in the sidebar to open the launcher. Search your pinned apps or describe a new one — the fastest way to move between tools once you have a few built up.',
    },
];

export function OnboardingModal() {
    const [visible, setVisible] = useState(false);
    const [slide, setSlide] = useState(0);

    useEffect(() => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            setVisible(true);
        }
    }, []);

    function close() {
        localStorage.setItem(STORAGE_KEY, 'done');
        setVisible(false);
    }

    if (!visible) return null;

    const current = slides[slide];
    const isLast = slide === slides.length - 1;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
        >
            <div className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: 'rgba(255,255,255,0.97)' }}>

                {/* Skip button */}
                <button
                    onClick={close}
                    className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 text-xs transition"
                    aria-label="Skip"
                >✕</button>

                {/* Slide image */}
                <div className="w-full overflow-hidden" style={{ height: '220px', background: '#0f0f13' }}>
                    <img
                        key={current.image}
                        src={current.image}
                        alt={current.title}
                        className="w-full h-full object-cover object-top"
                        style={{ transition: 'opacity 0.25s' }}
                    />
                </div>

                {/* Text */}
                <div className="px-6 pt-5 pb-2" style={{ minHeight: '110px' }}>
                    <h2 className="text-lg font-semibold text-zinc-900 mb-2 tracking-tight">{current.title}</h2>
                    <p className="text-sm text-zinc-500 leading-relaxed">{current.body}</p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 flex items-center justify-between">

                    {/* Dot indicators */}
                    <div className="flex items-center gap-1.5">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setSlide(i)}
                                className="rounded-full transition-all"
                                style={{
                                    height: '6px',
                                    width: i === slide ? '18px' : '6px',
                                    background: i === slide ? '#18181b' : '#d4d4d8',
                                }}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                        {slide > 0 && (
                            <button
                                onClick={() => setSlide(s => s - 1)}
                                className="px-4 py-1.5 text-sm rounded-lg text-zinc-400 hover:text-zinc-700 transition"
                            >Back</button>
                        )}
                        {isLast ? (
                            <button
                                onClick={close}
                                className="px-5 py-1.5 text-sm rounded-xl bg-zinc-900 text-white hover:bg-zinc-700 active:scale-95 transition shadow"
                            >Get Started</button>
                        ) : (
                            <button
                                onClick={() => setSlide(s => s + 1)}
                                className="px-5 py-1.5 text-sm rounded-xl bg-zinc-900 text-white hover:bg-zinc-700 active:scale-95 transition shadow"
                            >Next →</button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
