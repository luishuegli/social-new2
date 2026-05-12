# API Documentation

**Version:** 1.0  
**Base URL:** `/api/v1`  
**Last Updated:** 2025-11-07

---

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Error Handling](#error-handling)
4. [Endpoints](#endpoints)
   - [Posts](#posts)
   - [Messages](#messages)
   - [Activities](#activities)
   - [Groups](#groups)
   - [Users](#users)
   - [Search](#search)

---

## Authentication

All API endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

### Getting a Token

1. Authenticate with Firebase Auth
2. Get the ID token: `await user.getIdToken()`
3. Include in Authorization header

### Error Responses

- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Valid token but insufficient permissions

---

## Rate Limiting

All endpoints are rate limited. Rate limit information is included in response headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Timestamp when limit resets

### Rate Limit Configurations

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Posts (read) | 100 | 1 minute |
| Posts (write) | 10 | 1 minute |
| Messages (send) | 30 | 1 minute |
| Search | 30 | 1 minute |
| Upload | 5 | 1 minute |
| Default | 60 | 1 minute |

### Rate Limit Exceeded

When rate limit is exceeded, you'll receive:

```json
{
  "success": false,
  "error": {
    "error": "Too many requests",
    "message": "Rate limit exceeded. Please try again after <timestamp>",
    "code": "RATE_LIMIT_EXCEEDED",
    "timestamp": "2025-11-07T12:00:00.000Z",
    "path": "/api/v1/posts/feed"
  }
}
```

**Status Code:** `429 Too Many Requests`

---

## Error Handling

All API responses follow a standard format:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-11-07T12:00:00.000Z",
    "requestId": "1234567890-abc123"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "error": "Error Type",
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": { ... },
    "timestamp": "2025-11-07T12:00:00.000Z",
    "path": "/api/v1/posts/feed"
  },
  "meta": {
    "timestamp": "2025-11-07T12:00:00.000Z",
    "requestId": "1234567890-abc123"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `INVALID_TOKEN` | 401 | Invalid or expired token |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Endpoints

### Posts

#### Get Feed

**GET** `/api/v1/posts/feed`

Returns paginated feed of posts from users the current user follows.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 20 | Number of posts to return (max: 100) |
| `lastId` | string | No | - | Post ID for pagination |

**Response:**

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post123",
        "authorId": "user123",
        "authorName": "John Doe",
        "authorAvatar": "https://...",
        "username": "johndoe",
        "content": "Post content...",
        "imageUrl": "https://...",
        "createdAt": "2025-11-07T12:00:00.000Z",
        "likes": 10,
        "comments": 5,
        "isLiked": false,
        "postType": "Individual",
        "authenticityType": "Live Post",
        "groupId": null,
        "groupName": null,
        "activityId": "activity123"
      }
    ],
    "hasMore": true,
    "count": 20
  }
}
```

**Rate Limit:** 100 requests/minute

---

#### Create Post

**POST** `/api/v1/posts`

Creates a new post.

**Request Body:**

```json
{
  "activityTitle": "Activity Title",
  "activityCategory": "Sports",
  "activityDate": "2025-11-08T12:00:00.000Z",
  "activityDescription": "Activity description",
  "description": "Post description",
  "imageUrl": "https://...",
  "visibility": "public",
  "authenticityType": "Live Post",
  "postType": "Individual"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "postId": "post123",
    "message": "Post created successfully"
  }
}
```

**Rate Limit:** 10 requests/minute

---

### Messages

#### Send Message

**POST** `/api/v1/messages/send`

Sends a message in a conversation.

**Request Body:**

```json
{
  "conversationId": "conv123",
  "text": "Message text"
}
```

**Validation:**

- `conversationId`: Required, string, min length 1
- `text`: Required, string, min length 1, max length 5000

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Message sent successfully",
    "messageId": "msg123"
  }
}
```

**Rate Limit:** 30 requests/minute

**Error Codes:**

- `CONVERSATION_NOT_FOUND` (404): Conversation doesn't exist
- `NOT_PARTICIPANT` (403): User is not a participant in the conversation

---

### Activities

#### Create Activity

**POST** `/api/v1/activities`

Creates a new activity.

**Request Body:**

```json
{
  "title": "Activity Title",
  "category": "Sports",
  "date": "2025-11-08T12:00:00.000Z",
  "description": "Activity description",
  "location": "Location",
  "groupId": "group123"
}
```

**Rate Limit:** 5 requests/minute

---

#### RSVP to Activity

**POST** `/api/v1/activities/rsvp`

RSVP to an activity.

**Request Body:**

```json
{
  "activityId": "activity123",
  "status": "attending"
}
```

**Status Values:** `attending`, `maybe`, `not_attending`

**Rate Limit:** 10 requests/minute

---

### Groups

#### Create Group

**POST** `/api/v1/groups`

Creates a new group.

**Request Body:**

```json
{
  "name": "Group Name",
  "description": "Group description",
  "category": "Sports",
  "isPrivate": false,
  "coverImage": "https://..."
}
```

**Rate Limit:** 3 requests/5 minutes

---

#### Join Group

**POST** `/api/v1/groups/join`

Joins a group.

**Request Body:**

```json
{
  "groupId": "group123"
}
```

**Rate Limit:** 10 requests/5 minutes

---

### Users

#### Get User Profile

**GET** `/api/v1/users/:userId`

Gets a user's profile.

**Response:**

```json
{
  "success": true,
  "data": {
    "uid": "user123",
    "displayName": "John Doe",
    "username": "johndoe",
    "profilePictureUrl": "https://...",
    "bio": "User bio",
    "email": "user@example.com"
  }
}
```

---

#### Update Profile

**PUT** `/api/v1/users/me`

Updates the current user's profile.

**Request Body:**

```json
{
  "displayName": "New Name",
  "bio": "New bio",
  "interests": ["sports", "music"],
  "profilePictureUrl": "https://..."
}
```

**Rate Limit:** 10 requests/minute

---

### Search

#### Search

**GET** `/api/v1/search`

Searches for users, groups, posts, or activities.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query (1-200 chars) |
| `type` | enum | No | `all`, `users`, `groups`, `posts`, `activities` |
| `limit` | number | No | Results per type (default: 10) |
| `offset` | number | No | Pagination offset (default: 0) |

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [...],
    "groups": [...],
    "posts": [...],
    "activities": [...],
    "total": 50
  }
}
```

**Rate Limit:** 30 requests/minute

---

## Request/Response Headers

### Request Headers

- `Authorization`: Bearer token (required for authenticated endpoints)
- `Content-Type`: `application/json` (for POST/PUT requests)

### Response Headers

- `X-Request-ID`: Unique request identifier
- `X-RateLimit-Limit`: Rate limit maximum
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp
- `X-Content-Type-Options`: `nosniff`
- `X-Frame-Options`: `DENY`
- `X-XSS-Protection`: `1; mode=block`

---

## Pagination

Many endpoints support pagination using cursor-based pagination:

1. Initial request: `GET /api/v1/posts/feed?limit=20`
2. Next page: `GET /api/v1/posts/feed?limit=20&lastId=<last_post_id>`

**Response includes:**

- `hasMore`: Boolean indicating if more results are available
- `count`: Number of items in current response

---

## Caching

Some endpoints use caching to improve performance. Cache is automatically invalidated when data changes.

**Cache TTL:** 5 minutes (default)

**Cache Headers:**

- `X-Cache-Status`: `HIT` or `MISS`
- `X-Cache-TTL`: Time to live in seconds

---

## Monitoring

All API requests are monitored and logged. Metrics include:

- Request count
- Response times
- Error rates
- Cache hit rates

**Request ID:** Every request includes a unique `requestId` for tracking.

---

## Versioning

API versioning is done via URL path:

- Current version: `/api/v1/...`
- Future versions: `/api/v2/...`

Old endpoints without version prefix are deprecated and will be removed in future versions.

---

## Support

For issues or questions:

1. Check error response for details
2. Include `requestId` from response when reporting issues
3. Check rate limit headers if receiving 429 errors

---

**Last Updated:** 2025-11-07  
**API Version:** 1.0


