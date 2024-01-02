import { UserModel } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  // check for image of avtar
  // upload item to the cloudinary
  // create user object and create entry in database
  // remove password and refresh token field from response
  // check for the user creation
  // return response

  // get the data from frontend / by using postman
  // console.log(req.body);
  const { username, email, fullName, password } = req.body;
  // console.log(email, password, username, fullName);

  // check that is not empty
  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required !!!");
  }

  // check if user is already exist
  const existed_User = UserModel?.findOne({ $or: [{ username }, { email }] });
  if (existed_User) {
    throw new ApiError(409, "User with username and email already exists");
  }
  // console.log(existed_User);
  // console.log(req?.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(404, "Avtar file is required....");
  }

  const avtar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avtar) {
    throw new ApiError(404, "Avtar file is required");
  }

  const user = await UserModel.create({
    fullName,
    avtar: avtar.url,
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
