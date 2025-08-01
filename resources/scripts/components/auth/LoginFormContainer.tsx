import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';

declare global {
    interface Window {
        SiteConfiguration?: {
            name?: string;
        };
    }
}

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const Container = styled.div`
    ${tw`h-screen w-full flex items-center justify-center p-4 relative overflow-hidden`}
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    
    ${breakpoint('sm')`
        ${tw`p-6`}
    `};

    ${breakpoint('md')`
        ${tw`p-8`}
    `};
`;

const ShootingStarsContainer = styled.div`
    ${tw`absolute top-0 left-0 w-full h-full pointer-events-none`}
`;

const NebulaBackground = styled.div`
    ${tw`absolute inset-0 pointer-events-none`}
`;

const LoginCard = styled.div`
    ${tw`w-full text-center max-w-md rounded-2xl shadow-2xl overflow-hidden z-10`}
`;

const WelcomeSection = styled.div`
    ${tw`p-6 bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-800`}
`;

const FormSection = styled.div`
    ${tw`p-6 bg-white/10 backdrop-blur-xl border-t border-white/20`}
`;

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => {
    const { name, logo } = useStoreState((state: ApplicationStore) => state.settings.data!);
    
    return (
    <Container>
        {/* Shooting Stars */}
        <ShootingStarsContainer>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
        </ShootingStarsContainer>

        {/* Nebula Background */}
        <NebulaBackground>
            <svg css={tw`absolute top-10 -left-20 w-96 h-96 text-purple-500 opacity-10`} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M48.2,-64.8C61.4,-55.3,70.3,-40.3,75.8,-24.1C81.3,-7.9,83.4,9.5,77.8,24.7C72.2,39.9,58.9,52.9,44.2,62.3C29.5,71.7,13.4,77.5,-3,79.5C-19.4,81.5,-38.8,79.7,-53.4,70.4C-68,61.1,-77.8,44.3,-81.1,26.7C-84.4,9.1,-81.2,-9.4,-73.4,-25.1C-65.6,-40.8,-53.2,-53.8,-39.4,-62.9C-25.6,-72,-10.4,-77.2,3.8,-79.1C18,-81,35,-74.4,48.2,-64.8Z" transform="translate(100 100)" />
            </svg>
            <svg css={tw`absolute bottom-0 -right-20 w-96 h-96 text-indigo-500 opacity-10`} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M51.4,-57.8C62.9,-47.9,65.9,-29.3,65.8,-11.9C65.7,5.5,62.5,21.7,54.1,35.5C45.7,49.3,32.1,60.7,16.9,65.8C1.7,70.9,-15.2,69.7,-30.5,62.9C-45.8,56.1,-59.5,43.7,-66.2,28.5C-72.9,13.3,-72.6,-4.7,-66.5,-20.2C-60.4,-35.7,-48.5,-48.7,-34.9,-57.1C-21.3,-65.5,-6,-69.3,9.1,-69.1C24.2,-68.9,39.9,-67.7,51.4,-57.8Z" transform="translate(100 100)" />
            </svg>
        </NebulaBackground>

        <LoginCard>
            <WelcomeSection>
                <div css={tw`mb-1 flex justify-center`}>
                    {logo ? (
                        <img 
                            src={logo} 
                            alt={name} 
                            style={{ height: '50px', maxWidth: '200px', objectFit: 'contain' }}
                            onError={(e) => {
                                // Fallback to default logo if custom logo fails
                                const target = e.currentTarget as HTMLImageElement;
                                target.src = "https://media.discordapp.net/attachments/1400463301347115048/1400492375863988255/HeppyLogo.png?ex=688cd5aa&is=688b842a&hm=fc50324595384e3abb6ed7d84f0ccb0c1137795c311e5b59a8412e52fc444578&=&format=webp&quality=lossless";
                            }}
                        />
                    ) : (
                        <img 
                            src="https://media.discordapp.net/attachments/1400463301347115048/1400492375863988255/HeppyLogo.png?ex=688cd5aa&is=688b842a&hm=fc50324595384e3abb6ed7d84f0ccb0c1137795c311e5b59a8412e52fc444578&=&format=webp&quality=lossless" 
                            alt="Octopus Logo" 
                            style={{ height: '50px' }}
                        />
                    )}
                </div>
                <h1 css={tw`text-2xl font-bold text-white`}>Welcome to {name}</h1>
                <p css={tw`text-indigo-200 mt-1 text-sm`}>
                    The next generation Pterodactyl theme, designed for performance and aesthetics.
                </p>
                <a href="#" css={tw`inline-block mt-4 text-sm text-white font-medium border-b border-white/50 hover:border-white transition no-underline`}>
                    Create an account
                </a>
            </WelcomeSection>

            <FormSection>
                <h2 css={tw`text-xl font-bold text-white mb-4 text-center`}>USER LOGIN</h2>
                <FlashMessageRender css={tw`mb-3`} />
                <Form {...props} ref={ref}>
                    {props.children}
                </Form>
            </FormSection>
        </LoginCard>
    </Container>
    );
});
