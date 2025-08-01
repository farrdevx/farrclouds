import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import requestPasswordResetEmail from '@/api/auth/requestPasswordResetEmail';
import { httpErrorToHuman } from '@/api/http';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import tw from 'twin.macro';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';
import styled from 'styled-components/macro';

interface Values {
    email: string;
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

const SubmitButton = styled.button`
    ${tw`w-full py-2.5 font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-300 shadow-lg disabled:opacity-50`}
`;

const BackToLoginLink = styled(Link)`
    ${tw`inline-block mt-4 text-sm text-white font-medium border-b border-white/50 hover:border-white transition no-underline`}
`;

const EmailIcon = () => (
    <svg css={tw`w-5 h-5 text-purple-300`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
);

export default () => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, addFlash } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

    const handleSubmission = ({ email }: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha data is returned by the component.
        if (recaptchaEnabled && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);

                setSubmitting(false);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            });

            return;
        }

        requestPasswordResetEmail(email, token)
            .then((response) => {
                resetForm();
                addFlash({ type: 'success', title: 'Success', message: response });
            })
            .catch((error) => {
                console.error(error);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            })
            .then(() => {
                setToken('');
                if (ref.current) ref.current.reset();

                setSubmitting(false);
            });
    };

    return (
        <Formik
            onSubmit={handleSubmission}
            initialValues={{ email: '' }}
            validationSchema={object().shape({
                email: string()
                    .email('A valid email address must be provided to continue.')
                    .required('A valid email address must be provided to continue.'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm, values, handleChange, handleBlur }) => (
                <LoginFormContainer title={'Reset Password'}>
                    <div css={tw`space-y-4`}>
                        {/* Email Input */}
                        <InputContainer>
                            <InputIcon>
                                <EmailIcon />
                            </InputIcon>
                            <StyledInput
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={values.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isSubmitting}
                            />
                        </InputContainer>

                        {/* Description */}
                        <p css={tw`text-gray-300 text-sm text-center`}>
                            Enter your account email address to receive instructions on resetting your password.
                        </p>

                        {/* Submit Button */}
                        <SubmitButton
                            type="submit"
                            disabled={isSubmitting}
                            onClick={(e) => {
                                e.preventDefault();
                                submitForm();
                            }}
                        >
                            {isSubmitting ? 'SENDING EMAIL...' : 'SEND RESET EMAIL'}
                        </SubmitButton>

                        {/* Back to Login Link */}
                        <div css={tw`text-center`}>
                            <BackToLoginLink to={'/auth/login'}>
                                ← Back to Login
                            </BackToLoginLink>
                        </div>
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
