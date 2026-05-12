import { adminDb } from '@/app/Lib/firebaseAdmin';
import { Post } from '../firestoreModels';
import { logger } from '../logger';

export class PostService {
    private static collection = 'posts';

    static async getPosts(options: {
        limit?: number;
        lastPostId?: string;
        groupId?: string;
        activityId?: string;
    }): Promise<{ posts: Post[]; lastPostId: string | null; hasMore: boolean }> {
        try {
            const maxPosts = options.limit || 10;
            let query = adminDb.collection(this.collection).orderBy('timestamp', 'desc');

            if (options.groupId) {
                query = query.where('groupId', '==', options.groupId);
            }
            if (options.activityId) {
                query = query.where('activityId', '==', options.activityId);
            }

            if (options.lastPostId) {
                const lastDoc = await adminDb.collection(this.collection).doc(options.lastPostId).get();
                if (lastDoc.exists) {
                    query = query.startAfter(lastDoc);
                }
            }

            query = query.limit(maxPosts);
            const snapshot = await query.get();

            const posts = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate?.() || data.timestamp,
                    createdAt: data.createdAt?.toDate?.() || data.createdAt,
                } as Post;
            });

            return {
                posts,
                lastPostId: posts.length > 0 ? posts[posts.length - 1].id! : null,
                hasMore: posts.length === maxPosts,
            };
        } catch (error) {
            logger.error('Error fetching posts:', error);
            throw error;
        }
    }

    static async createPost(postData: Omit<Post, 'id' | 'timestamp' | 'createdAt' | 'likes' | 'comments'>): Promise<string> {
        try {
            const newPost = {
                ...postData,
                likes: 0,
                comments: 0,
                timestamp: new Date(),
                createdAt: new Date(),
            };

            const docRef = await adminDb.collection(this.collection).add(newPost);
            return docRef.id;
        } catch (error) {
            logger.error('Error creating post:', error);
            throw error;
        }
    }
}
