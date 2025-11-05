import React from 'react';

interface WelcomeTutorialProps {
    step: number;
    targetRect: DOMRect | null;
}

const STEPS_CONFIG = [
    { text: "¡Atento!", position: 'center', arrow: false },
    { text: "¡El equipo creció!", position: 'target', arrow: true },
    { text: "Aquí están las verificaciones de confiabilidad.", position: 'target', arrow: true },
];

const Arrow: React.FC = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white drop-shadow-lg">
        <path d="M12 5V19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 15L12 19L8 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


const WelcomeTutorial: React.FC<WelcomeTutorialProps> = ({ step, targetRect }) => {
    if (step === 0) return null;

    const config = STEPS_CONFIG[step - 1];
    if (!config) return null;
    
    const spotlightStyle: React.CSSProperties = targetRect ? {
        position: 'absolute',
        left: `${targetRect.left - 8}px`,
        top: `${targetRect.top - 8}px`,
        width: `${targetRect.width + 16}px`,
        height: `${targetRect.height + 16}px`,
        borderRadius: '12px',
        boxShadow: '0 0 0 500vmax rgba(0, 0, 0, 0.65)',
        transition: 'all 0.5s cubic-bezier(0.65, 0, 0.35, 1)',
        pointerEvents: 'none',
    } : {
        // Default to no spotlight if no target
        boxShadow: '0 0 0 500vmax rgba(0, 0, 0, 0.65)',
        opacity: step === 1 ? 1 : 0,
    };
    
    const getTextPositionStyles = (): React.CSSProperties => {
        if (config.position === 'center' || !targetRect) {
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
            };
        }
        // Position text ABOVE the spotlight
        return {
            top: `${targetRect.top - 16}px`,
            left: `${targetRect.left + targetRect.width / 2}px`,
            transform: 'translate(-50%, -100%)',
            textAlign: 'center',
            minWidth: '280px',
        };
    };

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none">
            <div style={spotlightStyle} />

            <div
                key={step} // Use key to re-trigger animation on step change
                className="absolute p-4 transition-all duration-500 ease-in-out animate-pop-in"
                style={getTextPositionStyles()}
            >
                <div className="relative flex flex-col items-center">
                     <p className="text-xl font-semibold text-white drop-shadow-lg">
                        {config.text}
                     </p>
                    {config.arrow && (
                        <div className="mt-2 animate-arrow-bounce">
                           <Arrow />
                        </div>
                    )}
                </div>
            </div>
             <style>{`
                @keyframes pop-in {
                    from { opacity: 0; transform: scale(0.9) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-pop-in { 
                    animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                 @keyframes arrow-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(8px); }
                }
                .animate-arrow-bounce { animation: arrow-bounce 1.5s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default WelcomeTutorial;