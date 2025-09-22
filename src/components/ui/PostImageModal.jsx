'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import LiquidGlass from './LiquidGlass';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { db } from '@/app/Lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';

export default function PostImageModal({
  isOpen,
  post,
  onClose,
  onPrev,
  onNext,
}) {
  const { user } = useAuth?.() || {};
  const [comments, setComments] = React.useState([]);
  const [newComment, setNewComment] = React.useState('');
  const [liked, setLiked] = React.useState(false);

  // Load comments when opened
  React.useEffect(() => {
    if (!isOpen || !post?.id) return;
    const commentsRef = collection(db, 'posts', post.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setComments(items);
    });
    return () => unsub();
  }, [isOpen, post?.id]);

  // Like state
  React.useEffect(() => {
    (async () => {
      if (!isOpen || !post?.id || !user?.uid) return setLiked(false);
      const likeDoc = await getDoc(doc(db, 'posts', post.id, 'likes', user.uid));
      setLiked(likeDoc.exists());
    })();
  }, [isOpen, post?.id, user?.uid]);

  const handleSend = async () => {
    if (!user?.uid || !post?.id || !newComment.trim()) return;
    const commentsRef = collection(db, 'posts', post.id, 'comments');
    await addDoc(commentsRef, {
      text: newComment.trim(),
      authorId: user.uid,
      authorName: user.displayName || user.email || 'User',
      authorAvatar: user.profilePictureUrl || user.photoURL || '',
      createdAt: serverTimestamp(),
    });
    setNewComment('');
  };

  const toggleLike = async () => {
    if (!user?.uid || !post?.id) return;
    const likeRef = doc(db, 'posts', post.id, 'likes', user.uid);
    const snapshot = await getDoc(likeRef);
    if (snapshot.exists()) {
      await deleteDoc(likeRef);
      setLiked(false);
    } else {
      await setDoc(likeRef, { createdAt: serverTimestamp() });
      setLiked(true);
    }
  };
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') onPrev?.();
      if (e.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      {isOpen && post && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-5xl"
          >
            <LiquidGlass className="p-0 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 min-h-[60vh]">
                {/* Image area */}
                <div className="photoContainer relative md:col-span-2 h-[60vh] md:h-[75vh] overflow-hidden bg-black/70">
                  <Image
                    src={(post.imageUrl && post.imageUrl.trim()) ? post.imageUrl : `https://picsum.photos/seed/${post.id}/1200/900`}
                    alt={post.title || 'Post image'}
                    fill
                    sizes="(max-width: 768px) 100vw, 66vw"
                    className="object-cover"
                  />
                </div>

                {/* Meta area */}
                <div className="p-4 md:p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                        {post?.author?.avatarUrl ? (
                          <Image src={post.author.avatarUrl} alt={post.author.name || 'User'} width={40} height={40} className="object-cover" />
                        ) : (
                          <span className="text-sm text-white font-semibold">{post?.author?.name?.[0]?.toUpperCase?.() || 'U'}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{post?.author?.name || 'User'}</p>
                        <p className="text-white/60 text-xs">{post?.timestamp}</p>
                      </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-white font-semibold">{post?.title}</h3>
                    <p className="text-white/70 text-sm">{post?.content}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-4">
                    <button onClick={toggleLike} className={`text-white ${liked ? '' : 'text-white/70'} hover:text-white`}>
                      <Heart className={`w-5 h-5 ${liked ? 'fill-white' : ''}`} />
                    </button>
                    <button className="text-white/70 hover:text-white">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <button className="text-white/70 hover:text-white">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Comments list */}
                  <div className="mt-4 space-y-3 overflow-y-auto max-h-[30vh] pr-1">
                    {comments.map((c) => (
                      <div key={c.id} className="text-sm text-white/90">
                        <span className="font-semibold text-white">{c.authorName || 'User'}</span>
                        <span className="ml-2 text-white/70">{c.text}</span>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-sm text-white/50">No comments yet. Be the first!</p>
                    )}
                  </div>

                  {/* New comment */}
                  <div className="mt-4 flex items-center gap-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    />
                    <button onClick={handleSend} className="px-3 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 backdrop-blur-sm">Post</button>
                  </div>
                </div>
              </div>
            </LiquidGlass>

            {/* Prev/Next */}
            {onPrev && (
              <button
                onClick={onPrev}
                className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

