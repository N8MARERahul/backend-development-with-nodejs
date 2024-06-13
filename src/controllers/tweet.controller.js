import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { contents } = req.body

    if (!contents) {
        throw new ApiError("Content of tweet is required")
    }

    const tweet = await Tweet.create({
        owner : req.user._id,
        content : contents
    })

    if (!tweet) {
        throw new ApiError(500, "Error in creating tweet")
    }

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        tweet,
        "Tweet created successfully"
    ))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params

    if (!userId) {
        throw new ApiError(400, "userId must be required")
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid userId")
    }    

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner : new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $project : {
                content : 1,
                createdAt : 1,
                updatedAt : 1
            }
        },
        {
            $sort : { createdAt : -1 }
        }
    ])

    if (!tweets?.length) {
        throw new ApiError(404, "No tweets found")
    }

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        tweets,
        "Tweets fetched successfully", 
    ))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body

    if (!tweetId) {
        throw new ApiError(400, "TweetID must be required")
    }

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    if (!content || content.length === 0) {
        throw new ApiError(400, "TweetContent is missing")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set : {
                content
            }
        },
        { new : true }
    )

    if (!tweet) {
        throw new ApiError(500, "Error while updating tweet")
    }

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        tweet,
        "Tweet edited successfully",
    ))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params

    if (!tweetId) {
        throw new ApiError(400, "TweetID must be required")
    }

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId)

    if (!tweet) {
        throw new ApiError(500, "Error while deleting tweet")
    }

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        tweet,
        "Tweet deleted successfully",
    ))    
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}