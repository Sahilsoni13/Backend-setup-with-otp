import * as yup from 'yup';

export const createUserSchema = yup.object().shape({
    name: yup.string().required("name is required"),
    email: yup.string().email().required("email is required"),
    password: yup.string().required().matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/, "password must contain at least 8 characters, one uppercase, one lowercase, one number")
})

export const updateUserSchema = yup.object().shape({
    email: yup.string().email().required("email is required"),
    oldpassword: yup.string().required("old password is required"),
    newPassword: yup.string().matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/, "password must contain at least 8 characters, one uppercase, one lowercase, one number")
})

