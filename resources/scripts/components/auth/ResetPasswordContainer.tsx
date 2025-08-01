import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import performPasswordReset from '@/api/auth/performPasswordReset';
import { httpErrorToHuman } from '@/api/http';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { Formik, FormikHelpers } from 'formik';
import { object, ref, string } from 'yup';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

interface Values {
    password: string;
    passwordConfirmation: string;
}

const InputContainer = styled.div`
    ${tw`relative`}
`;

const InputIcon = styled.div`
    ${tw`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none`}
`;

const StyledInput = styled.input`
    ${tw`w-full pl-10 pr-4 py-2.5 rounded-lg bg-black/20 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition disabled:opacity-50`}
`;

const EmailDisplay = styled.div`
    ${tw`w-full pl-10 pr-4 py-2.5 rounded-lg bg-black/10 border border-white/10 text-gray-300 text-sm`}
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

const LockIcon = () => (
    <svg css={tw`w-5 h-5 text-purple-300`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
);

export default ({ match, location }: RouteComponentProps<{ token: string }>) => {
    const [email, setEmail] = useState('');

    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const parsed = new URLSearchParams(location.search);
    if (email.length === 0 && parsed.get('email')) {
        setEmail(parsed.get('email') || '');
    }

    const submit = ({ password, passwordConfirmation }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();
        performPasswordReset(email, { token: match.params.token, password, passwordConfirmation })
            .then(() => {
                // @ts-expect-error this is valid
                window.location = '/';
            })
            .catch((error) => {
                console.error(error);

                setSubmitting(false);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                password: '',
                passwordConfirmation: '',
            }}
            validationSchema={object().shape({
                password: string()
                    .required('A new password is required.')
                    .min(8, 'Your new password should be at least 8 characters in length.'),
                passwordConfirmation: string()
                    .required('Your new password does not match.')
                    // @ts-expect-error this is valid
                    .oneOf([ref('password'), null], 'Your new password does not match.'),
            })}
        >
            {({ isSubmitting, values, handleChange, handleBlur, handleSubmit }) => (
                <LoginFormContainer title={'Reset Password'}>
                    <form onSubmit={handleSubmit}>
                        <div css={tw`space-y-4`}>
                            {/* Email Display */}
                            <InputContainer>
                                <InputIcon>
                                    <EmailIcon />
                                </InputIcon>
                                <EmailDisplay>
                                    {email || 'Loading...'}
                                </EmailDisplay>
                            </InputContainer>

                            {/* New Password Input */}
                            <InputContainer>
                                <InputIcon>
                                    <LockIcon />
                                </InputIcon>
                                <StyledInput
                                    type="password"
                                    name="password"
                                    placeholder="New Password"
                                    value={values.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={isSubmitting}
                                />
                            </InputContainer>

                            {/* Confirm Password Input */}
                            <InputContainer>
                                <InputIcon>
                                    <LockIcon />
                                </InputIcon>
                                <StyledInput
                                    type="password"
                                    name="passwordConfirmation"
                                    placeholder="Confirm New Password"
                                    value={values.passwordConfirmation}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={isSubmitting}
                                />
                            </InputContainer>

                            {/* Description */}
                            <p css={tw`text-gray-300 text-sm text-center`}>
                                Passwords must be at least 8 characters in length.
                            </p>

                            {/* Submit Button */}
                            <SubmitButton
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'RESETTING PASSWORD...' : 'RESET PASSWORD'}
                            </SubmitButton>

                            {/* Back to Login Link */}
                            <div css={tw`text-center`}>
                                <BackToLoginLink to={'/auth/login'}>
                                    ← Back to Login
                                </BackToLoginLink>
                            </div>
                        </div>
                    </form>
                </LoginFormContainer>
            )}
        </Formik>
    );
};
