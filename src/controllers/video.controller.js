import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    if (!userId) {
        throw new ApiError(400, "UserId is required")
    }

    const options = {
        page : parseInt(page),
        limit : parseInt(limit)
    }

    const pipeLine = []

    if (query) {
        const matchStage = { $match : { ...query} }
        pipeLine.push(matchStage)
    }

    pipeLine.push(
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner",
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
                _id : 1,
                videoFile : 1,
                thumbnail : 1,
                title : 1,
                description : 1,
                duration : 1,
                views : 1,
                isPublished : 1,
                owner : {
                    fullName : 1,
                    username : 1,
                    avatar : 1,
                },
                createdAt : 1,
                updatedAt : 1,
            }
        }
    )

    if (sortBy && sortType) {
        const sortStage = { 
            $sort : {
                [sortBy] : sortType === 'asc' ? 1 : -1
            }
        }
        pipeLine.push(sortStage)
    }

    const result = await Video.aggregatePaginate(
        Video.aggregate(pipeLine),
        options
    )

    if (!result) {
        throw new ApiError(500, "Aggregate failed")
    }

    if (result.totalDocs === 0) {
        throw new ApiError(400, "No Videos Found")
    }

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        result.docs,
        "Videos fetched successfully", 
    ))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if ([title, description].some(field => field === "")) {
        throw new ApiError(400, "Title and description of Video is required")
    }
    
    const videoFileLocalPath = req.files?.videoFile[0].path 
    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }
    const videoThumbnailLocalPath = req.files?.thumbnail[0].path 
    if (!videoThumbnailLocalPath) {
        throw new ApiError(400, "Video Thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(videoThumbnailLocalPath)

    if (!videoFile) {
        throw new ApiError(500, "Error uploading videoFile to cloudinary")
    }
    if (!thumbnail) {
        throw new ApiError(500, "Error uploading thumbnail to cloudinary")
    }

    const video = await Video.create({
        videoFile : videoFile.url,
        thumbnail : thumbnail.url,
        title,
        description,
        duration : videoFile.duration,
        owner : req.user?._id
    })

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        video,
        "Video Uploaded successfully", 
    ))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId) {
        throw new ApiError(400, "videoId is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(401, "Invalid videoId")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,
        video,
        "Video details fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body

    if (!(title || description)) {
        throw new ApiError(400, "Title or description is required")
    }

    let videoThumbnailLocalPath, thumbnail

    if (req.file) {
        videoThumbnailLocalPath = req.file?.path 
        thumbnail = await uploadOnCloudinary(videoThumbnailLocalPath)
        if (!thumbnail) {
            throw new ApiError(500, "Error uploading thumbnail to cloudinary")
        } 
    }

    let updatedVideo

    try {
        if (!thumbnail) {
            if (!title) {
                updatedVideo = await Video.findByIdAndUpdate(
                    videoId,
                    {
                        $set : { description }
                    },
                    { new : true}
                ) 
            }
            if (!description) {
                updatedVideo = await Video.findByIdAndUpdate(
                    videoId,
                    {
                        $set : { title }
                    },
                    { new : true}
                )
            }
            updatedVideo = await Video.findByIdAndUpdate(
                videoId,
                {
                    $set : { title, description }
                },
                { new : true}
            )
        } else {
            if (!title) {
                updatedVideo = await Video.findByIdAndUpdate(
                    videoId,
                    {
                        $set : { 
                            description,
                            thumbnail : thumbnail.url
                        }
                    },
                    { new : true}
                ) 
            }
            if (!description) {
                updatedVideo = await Video.findByIdAndUpdate(
                    videoId,
                    {
                        $set : { 
                            title,
                            thumbnail: thumbnail.url
                        }
                    },
                    { new : true}
                )
            }
            updatedVideo = await Video.findByIdAndUpdate(
                videoId,
                {
                    $set : { 
                        title, 
                        description,
                        thumbnail : thumbnail.url
                    }
                },
                { new : true}
            )
        }
    } catch (error) {
        throw new ApiError(400, "VideoId is not valid")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,
        updatedVideo,
        "Video updated successfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    const video = await Video.findByIdAndDelete(videoId)
    if (!video) {
        throw new ApiError(400, "Invalid videoId")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,
        video,
        "Video Deleted successfully")
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById( videoId )
     
    if (!video) {
        throw new ApiError(400, "Invalid videoId")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            isPublished : !video.isPublished 
        },
        { new : true }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedVideo,
            "isPublishes Toggled"
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}