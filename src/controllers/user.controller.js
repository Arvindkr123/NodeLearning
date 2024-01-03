import { UserModel } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;
  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required !!!");
  }
  const existed_User = await UserModel?.findOne({
    $or: [{ username }, { email }],
  });

  if (existed_User) {
    throw new ApiError(409, "User with username and email already exists");
  }
  // console.log(req);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // console.log(avatarLocalPath)
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.lenght > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(404, "Avtar file is required....");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(404, "Avtar file is required");
  }

  const user = await UserModel.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await UserModel.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating a user!!");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered!!"));
});

export { registerUser };
