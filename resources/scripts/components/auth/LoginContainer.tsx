import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import login from '@/api/auth/login';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import { Field as FormikField } from 'formik';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';
import styled from 'styled-components/macro';

interface Values {
    username: string;
    password: string;
}

const InputContainer = styled.div`
    ${tw`relative`}
`;

const InputIcon = styled.div`
    ${tw`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none`}
`;

const StyledInput = styled.input`
    ${tw`w-full pl-10 pr-4 py-2.5 rounded-lg bg-black/20 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition`}
`;

const CheckboxContainer = styled.div`
    ${tw`flex items-center justify-between text-sm`}
`;

const CheckboxWrapper = styled.div`
    ${tw`flex items-center`}
`;

const StyledCheckbox = styled.input`
    ${tw`h-4 w-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-600 rounded`}
`;

const CheckboxLabel = styled.label`
    ${tw`ml-2 text-gray-300`}
`;

const ForgotPasswordLink = styled(Link)`
    ${tw`font-medium text-purple-400 hover:text-purple-300 no-underline`}
`;

const LoginButton = styled.button`
    ${tw`w-full py-2.5 font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-300 shadow-lg disabled:opacity-50`}
`;

const UserIcon = () => (
    <svg css={tw`w-5 h-5 text-purple-300`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);

const LockIcon = () => (
    <svg css={tw`w-5 h-5 text-purple-300`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
);

const LoginContainer = ({ history }: RouteComponentProps) => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha data is returned by the component.
        if (recaptchaEnabled && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });

            return;
        }

        login({ ...values, recaptchaData: token })
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }

                history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
            })
            .catch((error) => {
                console.error(error);

                setToken('');
                if (ref.current) ref.current.reset();

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ username: '', password: '' }}
            validationSchema={object().shape({
                username: string().required('A username or email must be provided.'),
                password: string().required('Please enter your account password.'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm, values, handleChange, handleBlur }) => (
                <LoginFormContainer>
                    <div css={tw`space-y-4`}>
                        {/* Username Input */}
                        <InputContainer>
                            <InputIcon>
                                <UserIcon />
                            </InputIcon>
                            <StyledInput
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={values.username}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isSubmitting}
                            />
                        </InputContainer>

                        {/* Password Input */}
                        <InputContainer>
                            <InputIcon>
                                <LockIcon />
                            </InputIcon>
                            <StyledInput
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={values.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isSubmitting}
                            />
                        </InputContainer>

                        {/* Remember me and Forgot password */}
                        <CheckboxContainer>
                            <CheckboxWrapper>
                                <StyledCheckbox type="checkbox" id="remember" />
                                <CheckboxLabel htmlFor="remember">Remember me</CheckboxLabel>
                            </CheckboxWrapper>
                            <ForgotPasswordLink to={'/auth/password'}>
                                Forgot password?
                            </ForgotPasswordLink>
                        </CheckboxContainer>

                        {/* Login Button */}
                        <LoginButton
                            type="submit"
                            disabled={isSubmitting}
                            onClick={(e) => {
                                e.preventDefault();
                                submitForm();
                            }}
                        >
                            {isSubmitting ? 'LOGGING IN...' : 'LOGIN'}
                        </LoginButton>
                    </div>

                    {recaptchaEnabled && (
                        <Reaptcha
                            ref={ref}
                            size={'invisible'}
                            sitekey={siteKey || '_invalid_key'}
                            onVerify={(response) => {
                                setToken(response);
                                submitForm();
                            }}
                            onExpire={() => {
                                setSubmitting(false);
                                setToken('');
                            }}
                        />
                    )}
                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default LoginContainer;
