import { getAllUser, getUserById, createUser, updateUser, deleteUser } from "./users.services.js"

export const getUser = (req, res) => {
    res.json(getAllUser());
}

export const getById = (req, res) => {
    const id = Number(req.params.id)
    res.json({
        Message: "Success",
        user: getUserById(id)
    })
}

export const createuser = (req, res) => {
    const { username, email, password } = req.body;

    res.json({
        message: "Success",
        newUser: createUser(username, email, password)
    })
};

export const updateuser = (req, res) => {
    const id = Number(req.params.id);
    const { username } = req.body;

    res.json({
        Message: "Success",
        user: updateUser(id, username)
    })
};

export const deleteuser = (req, res) => {
    const id = Number(req.params.id);


    res.json({
        Message: "User Deleted",
        user: deleteUser(id)
    })
}