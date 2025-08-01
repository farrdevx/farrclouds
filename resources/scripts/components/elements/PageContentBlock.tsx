import React, { useEffect } from 'react';
import ContentContainer from '@/components/elements/ContentContainer';
import { CSSTransition } from 'react-transition-group';
import tw from 'twin.macro';
import FlashMessageRender from '@/components/FlashMessageRender';
import styled from 'styled-components/macro';

export interface PageContentBlockProps {
    title?: string;
    className?: string;
    showFlashKey?: string;
}

const OctopusContentContainer = styled(ContentContainer)`
    ${tw`my-4 sm:my-10`}
    
    & > div:first-child {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        padding: 1.5rem;
        position: relative;
        z-index: 10;
    }
`;

const FooterContainer = styled(ContentContainer)`
    ${tw`mb-4`}
    
    p {
        ${tw`text-center text-xs`}
        color: rgba(255, 255, 255, 0.4);
        
        a {
            ${tw`no-underline transition-colors duration-300`}
            color: rgba(255, 255, 255, 0.4);
            
            &:hover {
                color: rgba(167, 139, 250, 0.8);
            }
        }
    }
`;

const PageContentBlock: React.FC<PageContentBlockProps> = ({ title, showFlashKey, className, children }) => {
    useEffect(() => {
        if (title) {
            document.title = title;
        }
    }, [title]);

    return (
        <CSSTransition timeout={150} classNames={'fade'} appear in>
            <>
                <OctopusContentContainer className={className}>
                    <div>
                        {showFlashKey && <FlashMessageRender byKey={showFlashKey} css={tw`mb-4`} />}
                        {children}
                    </div>
                </OctopusContentContainer>
                <FooterContainer>
                    <p>
                        <a
                            rel={'noopener nofollow noreferrer'}
                            href={'https://pterodactyl.io'}
                            target={'_blank'}
                        >
                            Pterodactyl&reg;
                        </a>
                        &nbsp;&copy; 2015 - {new Date().getFullYear()}
                    </p>
                </FooterContainer>
            </>
        </CSSTransition>
    );
};

export default PageContentBlock;
