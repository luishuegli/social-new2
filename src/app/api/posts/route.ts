import { NextRequest, NextResponse } from 'next/server';
import { PostService } from '@/lib/services/postService';
import { handleAPIError, APIError } from '../../utils/errorHandler';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const groupId = searchParams.get('groupId') || undefined;
    const activityId = searchParams.get('activityId') || undefined;
    const lastPostId = searchParams.get('lastPostId') || undefined;

    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    if (limit > 20) {
      throw new APIError('Limit cannot exceed 20 posts per request', 400, null);
    }

    const result = await PostService.getPosts({
      limit,
      groupId,
      activityId,
      lastPostId
    });

    return NextResponse.json({
      ...result,
      message: 'Posts retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Posts API Error', error, 'posts-api');
    return handleAPIError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      authorId,
      content,
      imageUrl,
      groupId,
      activityId,
      authenticityType = 'Live Post',
      media,
      visibility,
      postType
    } = body;

    if (!authorId) {
      throw new APIError('Author ID is required', 400, null);
    }

    // Normalize media
    let finalMedia = media || [];
    if (imageUrl && finalMedia.length === 0) {
      finalMedia = [{ type: 'image', url: imageUrl }];
    }

    const postId = await PostService.createPost({
      authorId,
      content: content || '',
      media: finalMedia,
      imageUrl: imageUrl || (finalMedia.length > 0 ? finalMedia[0].url : undefined), // Legacy support
      groupId,
      activityId,
      authenticityType,
      visibility: visibility || 'public',
      postType: postType || 'Individual'
    });

    return NextResponse.json({
      success: true,
      postId,
      message: 'Post created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Create Post API Error', error, 'posts-api');
    return handleAPIError(error);
  }
}


