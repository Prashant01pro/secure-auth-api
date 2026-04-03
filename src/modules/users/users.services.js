import { User } from "./data.js";

export const getAllUser = () => {
    return User;
}

export const getUserById = (id) => {

    const user = User.find((u) => u.id === id);
    return user;

};

export const createUser = (email, password, username) => {

    const newUser = {
        id: User.length + 1,
        username: username,
        email: email,
        password: password,
    }

    User.push(newUser)

    return newUser;

}

export const updateUser = (id, username) => {
    const user = User.find((u) => u.id === id);

    user.username = username;

    return user;
}

export const deleteUser = (id) => {
    const index = User.findIndex((u) => u.id === id);

    const deletedUser = User.splice(index, 1)[0];

    return deletedUser;
}