import React, { useState, useEffect } from 'react';

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
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [currentRect, setCurrentRect] = useState(targetRect);

    // Effect to handle smooth transitions between steps
    useEffect(() => {
        setIsTransitioning(true);
        const timer = setTimeout(() => {
            setCurrentRect(targetRect);
            setIsTransitioning(false);
        }, 300); // Half of the total transition time for a smooth fade-out/fade-in

        return () => clearTimeout(timer);
    }, [targetRect]);
    
    const currentConfig = STEPS_CONFIG[step - 1];
    const isSpotlightVisible = step > 0 && !isTransitioning;

    const spotlightStyle: React.CSSProperties = {
        position: 'absolute',
        left: currentRect ? `${currentRect.left - 8}px` : '50%',
        top: currentRect ? `${currentRect.top - 8}px` : '50%',
        width: currentRect ? `${currentRect.width + 16}px` : '0px',
        height: currentRect ? `${currentRect.height + 16}px` : '0px',
        transform: currentRect ? 'none' : 'translate(-50%, -50%)',
        borderRadius: '12px',
        boxShadow: `0 0 0 500vmax rgba(0, 0, 0, ${isSpotlightVisible ? 0.65 : 0})`,
        transition: 'box-shadow 0.3s ease-in-out, opacity 0.3s ease-in-out, top 0.3s ease-in-out, left 0.3s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out',
        opacity: isSpotlightVisible ? 1 : 0,
        pointerEvents: 'none',
    };
    
    const getWrapperPositionStyles = (): React.CSSProperties => {
        if (!currentConfig || currentConfig.position === 'center' || !currentRect) {
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            };
        }
        return {
            top: `${currentRect.top - 16}px`,
            left: `${currentRect.left + currentRect.width / 2}px`,
            transform: 'translate(-50%, -100%)',
        };
    };

    const isTextVisible = step > 0 && !isTransitioning;

    const wrapperStyles: React.CSSProperties = {
        ...getWrapperPositionStyles(),
        position: 'absolute',
        textAlign: 'center',
        minWidth: '280px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isTextVisible ? 1 : 0,
        pointerEvents: 'none',
    };

    return (
        <div className="fixed inset-0 z-[200]">
            <div style={spotlightStyle} />

            <div style={wrapperStyles}>
                <div className="relative h-28 flex items-center justify-center overflow-hidden">
                    {STEPS_CONFIG.map((config, index) => {
                        const stepIndex = index + 1;
                        let transform = 'translateY(150%)';
                        if (stepIndex === step) {
                            transform = 'translateY(0)';
                        } else if (stepIndex < step) {
                            transform = 'translateY(-150%)';
                        }

                        return (
                            <div
                                key={index}
                                className="absolute transition-transform duration-500 ease-in-out"
                                style={{ transform, opacity: stepIndex === step ? 1 : 0 }}
                            >
                                <div className="flex flex-col items-center">
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
                        );
                    })}
                </div>
            </div>

            <style>{`
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