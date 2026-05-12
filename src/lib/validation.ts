import { z } from 'zod';
import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Common validation schemas used across the application
 */
export const schemas = {
  // User schemas
  userId: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(1).max(50, 'Display name must be between 1 and 50 characters'),
  
  // Post schemas
  postContent: z.string().min(1).max(5000, 'Post content must be between 1 and 5000 characters'),
  postDescription: z.string().max(5000, 'Description must be less than 5000 characters').optional(),
  
  // Activity schemas
  activityTitle: z.string().min(1).max(200, 'Activity title must be between 1 and 200 characters'),
  activityCategory: z.string().min(1).max(50, 'Category must be specified'),
  activityDate: z.string().datetime('Invalid date format').or(z.date()),
  activityDescription: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  
  // Group schemas
  groupName: z.string().min(1).max(100, 'Group name must be between 1 and 100 characters'),
  groupDescription: z.string().max(500, 'Description must be less than 500 characters').optional(),
  
  // Message schemas
  messageContent: z.string().min(1).max(1000, 'Message must be between 1 and 1000 characters'),
  conversationId: z.string().min(1, 'Conversation ID is required'),
  
  // Pagination schemas
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  lastId: z.string().optional(),
  
  // Common schemas
  timestamp: z.string().datetime().or(z.date()),
  url: z.string().url('Invalid URL format').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  visibility: z.enum(['public', 'private', 'followers']).default('public'),
  authenticityType: z.enum(['Live Post', 'Later Post']).default('Later Post'),
  postType: z.enum(['Individual', 'Collaborative']).default('Individual'),
};

/**
 * Create post validation schema
 */
export const createPostSchema = z.object({
  activityTitle: schemas.activityTitle,
  activityCategory: schemas.activityCategory,
  activityDate: schemas.activityDate,
  activityDescription: schemas.activityDescription,
  description: schemas.postContent,
  imageUrl: schemas.imageUrl,
  visibility: schemas.visibility,
  authenticityType: schemas.authenticityType,
  postType: schemas.postType,
});

/**
 * Send message validation schema
 */
export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  text: z.string().min(1, 'Message text is required').max(5000, 'Message text too long (max 5000 characters)'),
});

/**
 * Create group validation schema
 */
export const createGroupSchema = z.object({
  name: schemas.groupName,
  description: schemas.groupDescription,
  category: z.string().min(1).max(50),
  isPrivate: z.boolean().default(false),
  coverImage: schemas.imageUrl,
});

/**
 * Update profile validation schema
 */
export const updateProfileSchema = z.object({
  displayName: schemas.displayName.optional(),
  bio: z.string().max(500).optional(),
  interests: z.array(z.string()).max(20).optional(),
  profilePictureUrl: schemas.imageUrl,
});

/**
 * Pagination query params schema
 */
export const paginationSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  lastId: schemas.lastId,
  lastPostId: z.string().optional(),
  groupId: z.string().optional(),
  activityId: z.string().optional(),
});

/**
 * Alias for backward compatibility
 */
export const paginationQuerySchema = paginationSchema;

/**
 * RSVP activity schema
 */
export const rsvpActivitySchema = z.object({
  activityId: z.string().min(1, 'Activity ID is required'),
  status: z.enum(['attending', 'maybe', 'not_attending']),
});

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  query: z.string().min(1).max(200, 'Search query must be between 1 and 200 characters'),
  type: z.enum(['all', 'users', 'groups', 'posts', 'activities']).default('all'),
  limit: schemas.limit,
  offset: schemas.offset,
});

/**
 * Type exports for use in components
 */
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type RSVPActivityInput = z.infer<typeof rsvpActivitySchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

/**
 * Validation error response helper
 */
export function validationErrorResponse(error: z.ZodError<any>) {
  const formattedErrors = error.issues.map(err => ({
    path: err.path.join('.'),
    message: err.message
  }));

  logger.warn('Validation error', { errors: formattedErrors }, 'validation');

  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: formattedErrors
    },
    { status: 400 }
  );
}

/**
 * Validate request body against a schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        response: validationErrorResponse(error) 
      };
    }
    
    logger.error('Failed to parse request body', error, 'validation');
    
    return {
      success: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request body' 
        },
        { status: 400 }
      )
    };
  }
}

/**
 * Validate query parameters against a schema
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const validated = schema.parse(params);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        response: validationErrorResponse(error) 
      };
    }
    
    return {
      success: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters' 
        },
        { status: 400 }
      )
    };
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  // Basic HTML entity encoding
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

/**
 * Validate and sanitize file uploads
 */
export const fileUploadSchema = z.object({
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  type: z.string().refine(
    (type) => {
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/quicktime'
      ];
      return allowedTypes.includes(type);
    },
    'Invalid file type'
  ),
  name: z.string().transform(name => 
    // Sanitize filename
    name.replace(/[^a-zA-Z0-9._-]/g, '_')
  )
});

export type FileUploadInput = z.infer<typeof fileUploadSchema>;
