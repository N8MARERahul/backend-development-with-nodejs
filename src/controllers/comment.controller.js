import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    const options = {
        page : parseInt(page),
        limit : parseInt(limit)
    }

    const pipeLine = [
        {
            $match : {
                video : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner"
            }
        },
        {
            $addFields : {
                owner : {
                    $first : "$owner"
                }
            }
        },
        {
            $project : {
                content : 1,
                owner : {
                    fullName : 1,
                    username : 1,
                    avatar : 1,
                },
                createdAt : 1,
                updatedAt : 1,
            }
        },
        {
            $sort : { updatedAt : -1 }
        }
    ]

    const comments = await Comment.aggregatePaginate(
        Comment.aggregate(pipeLine),
        options
    )

    if (!comments) {
        throw new ApiError(500, "Error in fetching comments")
    }

    if ( comments.totalDocs === 0 ) {
        return res
        .status(201)
        .json( new ApiResponse (201, "No comments found") )
    }

    return res
        .status(200)
        .json( new ApiResponse(
            200, 
            comments.docs,
            "Comments fetched successfully"
        ))    
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const { videoId } = req.params

    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found for the videoId")
    }

    const { content } = req.body
    if (!content) {
        throw new ApiError(400, "Comment content must be provided")
    }

    const comment = await Comment.create({
        content,
        video : videoId,
        owner : req.user._id
    })

    if(!comment) {
        throw new ApiError(500, "Error creating comment")
    }

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        comment,
        "Comment Added successfully"
    ))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body
    
    if (!content) {
        throw new ApiError(400, "Comment content must be provided")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set : { content }
        },
        { new : true }
    )

    if (!comment) {
        throw new ApiError(400, "CommentId invalid")
    }

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        comment,
        "Comment Updated successfully"
    ))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    const comment = await Comment.findByIdAndDelete(commentId)

    if (!comment) {
        throw new ApiError(400, "Invalid CommentId")
    }

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        comment,
        "Comment deleted successfully"
    ))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }