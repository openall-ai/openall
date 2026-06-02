import { observer } from "mobx-react-lite";
import { useState } from "react";
import { windowStateStore } from "../windows/windowState";

const PLATFORMS = [
    {
        name: "Twitter / X",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
        action: (caption: string) => {
            const text = encodeURIComponent(caption);
            const url = encodeURIComponent("https://useopenall.com");
            openUrl(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
        },
    },
    {
        name: "Bluesky",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.204-.659-.299-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
            </svg>
        ),
        action: (caption: string) => {
            const text = encodeURIComponent(`${caption}\nhttps://useopenall.com`);
            openUrl(`https://bsky.app/intent/compose?text=${text}`);
        },
    },
    {
        name: "Threads",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.751-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.481-2.256h.044c3.601 0 4.8 3.751 4.8 7.558 0 .154-.006.306-.02.456 1.15.687 2.027 1.607 2.559 2.819.877 2.012.851 5.231-1.693 7.684-1.802 1.761-4.017 2.636-6.719 2.892zm-1.55-7.283c.799-.043 1.437-.279 1.895-.701.435-.401.674-1.042.713-1.909a11.734 11.734 0 0 0-2.545-.105c-.816.049-1.449.248-1.825.561-.336.28-.494.638-.47 1.065.047.87.794 1.112 2.232 1.089z" />
            </svg>
        ),
        action: (caption: string) => {
            const text = encodeURIComponent(`${caption}\nhttps://useopenall.com`);
            openUrl(`https://threads.net/intent/post?text=${text}`);
        },
    },
    {
        name: "WhatsApp",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
        ),
        action: (caption: string) => {
            const text = encodeURIComponent(`${caption}\nhttps://useopenall.com`);
            const api = (window as any).api;
            // In Electron, use whatsapp:// scheme to open the desktop app
            if (api?.openExternal) {
                openUrl(`whatsapp://send?text=${text}`);
            } else {
                openUrl(`https://wa.me/?text=${text}`);
            }
        },
    },
    {
        name: "Telegram",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
        ),
        action: (caption: string) => {
            const url = encodeURIComponent("https://useopenall.com");
            const text = encodeURIComponent(caption);
            openUrl(`https://t.me/share/url?url=${url}&text=${text}`);
        },
    },
    {
        name: "Reddit",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
            </svg>
        ),
        action: (caption: string) => {
            const url = encodeURIComponent("https://useopenall.com");
            const title = encodeURIComponent(caption);
            openUrl(`https://reddit.com/submit?url=${url}&title=${title}`);
        },
    },
    {
        name: "LinkedIn",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        ),
        action: (_caption: string, imageDataUrl: string) => {
            const link = document.createElement("a");
            link.href = imageDataUrl;
            link.download = "openall-share.png";
            link.click();
            openUrl(`https://www.linkedin.com/feed/`);
        },
        isDownload: true,
    },
    {
        name: "Facebook",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        ),
        action: (_caption: string) => {
            openUrl(`https://facebook.com/sharer/sharer.php?u=useopenall.com`);
        },
    },
    {
        name: "Pinterest",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
            </svg>
        ),
        action: (caption: string) => {
            const url = encodeURIComponent("https://useopenall.com");
            const desc = encodeURIComponent(caption);
            openUrl(`https://pinterest.com/pin/create/button/?url=${url}&description=${desc}`);
        },
    },
    {
        name: "Instagram",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            </svg>
        ),
        action: (_caption: string, imageDataUrl: string) => {
            // Instagram has no desktop web share URL — trigger a PNG download
            const link = document.createElement("a");
            link.href = imageDataUrl;
            link.download = "openall-share.png";
            link.click();
        },
        isDownload: true,
    },
] as const;

function openUrl(url: string) {
    const api = (window as any).api;
    if (api?.openExternal) {
        api.openExternal(url);
    } else {
        window.open(url, "_blank");
    }
}

function dataUrlToBlob(dataUrl: string): Blob {
    const [header, base64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)![1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

async function copyImageToClipboard(imageDataUrl: string): Promise<void> {
    const api = (window as any).api;
    if (api?.clipboardWriteImage) {
        await api.clipboardWriteImage(imageDataUrl);
        return;
    }
    const blob = dataUrlToBlob(imageDataUrl);
    await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
    ]);
}

export const ShareModal = observer(() => {
    const state = windowStateStore.shareState;
    const [caption, setCaption] = useState("");
    const [copied, setCopied] = useState(false);
    const [copiedMessage, setCopiedMessage] = useState("");
    const [clipboardError, setClipboardError] = useState<string | null>(null);

    if (!state?.active) return null;

    const handlePlatformClick = async (platform: typeof PLATFORMS[number]) => {
        setClipboardError(null);
        const isDownload = (platform as any).isDownload;

        if (isDownload) {
            setCopiedMessage("Image downloaded — attach it to your post using the image upload button.");
            setCopied(true);
            setTimeout(() => setCopied(false), 6000);
            platform.action(caption, state.imageDataUrl);
            return;
        }

        try {
            await copyImageToClipboard(state.imageDataUrl);
            setCopiedMessage("Image copied to clipboard — paste it with ⌘V (Mac) or Ctrl+V");
            setCopied(true);
            setTimeout(() => setCopied(false), 5000);
        } catch (err: any) {
            console.error("Clipboard write failed:", err);
            setClipboardError(err?.message ?? "Clipboard write failed — try right-clicking the preview image to copy it manually.");
        }
        (platform.action as (c: string) => void)(caption);
    };

    const handleClose = () => {
        windowStateStore.setShareState(null);
        setCaption("");
        setCopied(false);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={handleClose}
        >
            <div
                className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-zinc-800 truncate pr-4">
                        Share — {state.windowTitle}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="w-7 h-7 rounded-lg hover:bg-zinc-200/80 flex items-center justify-center text-zinc-500 transition flex-shrink-0"
                    >
                        &times;
                    </button>
                </div>

                {/* Screenshot preview */}
                <img
                    src={state.imageDataUrl}
                    alt="Window screenshot"
                    className="w-full rounded-xl border border-zinc-200 object-contain max-h-64"
                />

                {/* Caption */}
                <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    rows={2}
                    className="w-full resize-none rounded-xl border border-zinc-200 bg-white/70 p-3 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition"
                />

                {/* Clipboard confirmation / error */}
                {copied && (
                    <div className="text-xs text-center text-emerald-600 font-medium">
                        {copiedMessage}
                    </div>
                )}
                {clipboardError && (
                    <div className="text-xs text-center text-red-500 font-medium">
                        {clipboardError}
                    </div>
                )}

                {/* Platform grid */}
                <div className="grid grid-cols-5 gap-2">
                    {PLATFORMS.map((platform) => (
                        <button
                            key={platform.name}
                            onClick={() => handlePlatformClick(platform)}
                            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-zinc-100 transition text-zinc-600 hover:text-zinc-900"
                        >
                            {platform.icon}
                            <span className="text-[10px] leading-tight text-center">
                                {platform.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
});
