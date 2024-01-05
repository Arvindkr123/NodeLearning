import { UserModel } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

// function for generating access and refresh token
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // save the refresh token in the user
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating and refresh and access token"
    );
  }
};

// register controller
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
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
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

// login controller
const loginUser = asyncHandler(async (req, res) => {
  //TODO:
  //  get the data from req body
  // check username and email is exist
  // find the user
  // password check
  // access and refresh generate and send the user
  // send cookie

  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new ApiError(400, "usename and email is required!!");
  }

  const user = await UserModel.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isValidPassword = await user.isPasswordCorrect(password);
  if (!isValidPassword) {
    throw new ApiError(401, "password is not correct");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await UserModel.findById(user._id).select(
    "-password -refreshToken"
  );

  // send cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In successfully.."
      )
    );
});

// logout user
const logoutUser = asyncHandler(async (req, res) => {
  // first find the user by id in database and remove the refresh token
  await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  // and now remove tokens from the cookies as well
  const options = {
    httpOnly: true,
    secure: true,
  };

  // clear cookie
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logout successfully..."));
});

// refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  // console.log(req.cookies);
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is not valid");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await UserModel.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token!!");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired! or used..");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "access token refreshed successfully!!"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.messge || "invalid refresh token!!");
  }
});

// change current password controller
const changeCurrentPassword = asyncHandler(async (req, res) => {
  // get old password and new password from frontend..
  const { oldPassword, newPassword } = req.body;

  // now we checking in database which user we want to change password find that user..
  const user = await UserModel.findById(req.user?._id);
  if (!user) {
    throw new ApiError(401, "User not found..");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid password");
  }
  // now change the password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password change successfully"));
});

// get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "Current user fetched successfully!!!")
    );
});

// update account details
const updateAccountDetails = asyncHandler(async (req, res) => {
  // get account details from frontend
  const { fullName, email } = req.body;

  // validate email and full name
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  // check in database which user you want to update details then first find the user and then update that..
  const user = UserModel.findByIdAndRemove(
    req.user._id,
    {
      $set: { fullName, email },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "account details updated successfully!!!")
    );
});

// update user avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  // get the avatar data from frontend..
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(401, "Avatar file is required..");
  }

  // upload on cloudinary server
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(401, "Error : while uploading avatar file");
  }

  // now update in the database also
  const user = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully!!"));
});

// update user cover image
const updateUserCoverImage = asyncHandler(async (req, res) => {
  // get user cover image from frontend...
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(401, "cover image is not available");
  }
  // upload on the cloudinary
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage) {
    throw new ApiError(401, "Error: while uploading cover image");
  }

  // now update in the database also..
  const user = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      $set: { coverImage: coverImage.url },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "updated cover image successfully!!"));
});

export {
  updateUserCoverImage,
  updateUserAvatar,
  updateAccountDetails,
  changeCurrentPassword,
  getCurrentUser,
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
};
