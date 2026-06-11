import { useState, useEffect } from 'react';

const STORAGE_KEY = 'openall_onboarding_v1';

const slides = [
    {
        image: 'onboarding/01-main-screen.png',
        title: 'Welcome to openall',
        body: 'openall is a new kind of desktop. There are no apps to install, no tabs to manage, no tools to find. Just describe what you need and it appears. A calculator, a live report, a research tool, an answer. Whatever the moment calls for, built instantly, right here. And everything you create stays: your tools, your data, your workflows, always there when you come back.',
    },
    {
        image: 'onboarding/02-chat-expanded.png',
        title: 'Describe what you need',
        body: 'Talk to openall the way you\'d talk to a brilliant colleague. Tell it what you\'re working on, what you need, what\'s on your mind. Plain language is all it takes. The more context you give, the more it delivers.',
    },
    {
        image: 'onboarding/07-draggable-window.png',
        title: 'Your problem, solved',
        body: 'In seconds, your problem becomes a working solution. Not a link to a tool, not a template to fill out. The exact value you looked for, delivered and running, right in front of you.',
    },
    {
        image: 'onboarding/10-pinned-app-sidebar.png',
        title: 'Your apps live in the sidebar',
        body: 'Pin any window to keep it across sessions. Your pinned apps are always one click away — openall restores the UI instantly and refreshes the data in the background.',
    },
    {
        image: 'onboarding/06-launcher-overlay.png',
        title: 'Launch anything, anytime',
        body: 'Use the search icon in the sidebar to open the launcher. Jump between your pinned apps or describe a new tool — the fastest way to get things done.',
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
