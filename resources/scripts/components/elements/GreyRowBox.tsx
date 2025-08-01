import styled from 'styled-components/macro';
import tw from 'twin.macro';

export default styled.div<{ $hoverable?: boolean }>`
    ${tw`flex rounded no-underline text-white items-center p-4 border transition-all duration-500 overflow-hidden relative`};
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(124, 58, 237, 0.15);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.08);
    z-index: 10;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(124, 58, 237, 0.08) 50%, 
            transparent 100%);
        transition: left 0.6s ease;
        z-index: -1;
    }

    ${(props) => props.$hoverable !== false && `
        &:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(124, 58, 237, 0.4);
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
                        0 0 24px rgba(124, 58, 237, 0.2),
                        0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        &:hover::before {
            left: 100%;
        }

        &:hover .icon {
            box-shadow: 0 0 20px rgba(124, 58, 237, 0.4);
            transform: scale(1.05);
        }
    `};

    & .icon {
        ${tw`rounded-full w-16 flex items-center justify-center p-3 transition-all duration-300`};
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(139, 92, 246, 0.3));
        color: rgba(139, 92, 246, 1);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(124, 58, 237, 0.4);
        box-shadow: 0 4px 16px rgba(124, 58, 237, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
        position: relative;
        z-index: 20;
    }
`;
