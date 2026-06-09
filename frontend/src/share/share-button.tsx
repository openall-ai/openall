import { windowStateStore } from "../windows/windowState";

export const ShareIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
);

export const ShareButton = ({ title, windowFrameRef, }: { title: string, windowFrameRef: React.RefObject<HTMLDivElement | null>, }) => {

    const onShare = async (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (!(window as any).html2canvas) {
            // alert('html2canvas not loaded — check your network connection and refresh.');
            return;
        }
        if (!windowFrameRef.current) return;
        try {
            const canvas = await (window as any).html2canvas(windowFrameRef.current, { allowTaint: true, useCORS: false, backgroundColor: '#ffffff', logging: false });
            windowStateStore.setShareState({ active: true, imageDataUrl: canvas.toDataURL('image/png'), windowTitle: title });
        } catch (err) {
            console.error('html2canvas failed:', err);
            // alert('Screenshot failed — see console for details.');
        }
    };

    return <button onPointerDown={onShare} className="flex items-center gap-1 px-2 h-6 rounded hover:bg-zinc-300/80 transition text-zinc-700 text-xs">
        <ShareIcon />
        Share
    </button>

};