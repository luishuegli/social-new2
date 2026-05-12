import { NextResponse } from 'next/server';
import { adminDb } from '@/app/Lib/firebaseAdmin';

export async function GET() {
    const results: any = {
        timestamp: new Date().toISOString(),
        checks: {},
        summary: { total: 0, passed: 0, failed: 0 }
    };

    // Test 1: Check users collection
    try {
        const usersSnapshot = await adminDb.collection('users').limit(5).get();
        results.checks.users = {
            status: 'PASSED',
            count: usersSnapshot.size,
            sample: usersSnapshot.docs.map(d => ({ id: d.id, username: d.data().username }))
        };
        results.summary.passed++;
    } catch (error: any) {
        results.checks.users = { status: 'FAILED', error: error.message };
        results.summary.failed++;
    }
    results.summary.total++;

    // Test 2: Check posts collection
    try {
        const postsSnapshot = await adminDb.collection('posts').orderBy('timestamp', 'desc').limit(5).get();
        results.checks.posts = {
            status: 'PASSED',
            count: postsSnapshot.size,
            sample: postsSnapshot.docs.map(d => ({
                id: d.id,
                authorId: d.data().authorId,
                content: d.data().content?.substring(0, 50),
                timestamp: d.data().timestamp?.toDate?.()
            }))
        };
        results.summary.passed++;
    } catch (error: any) {
        results.checks.posts = { status: 'FAILED', error: error.message };
        results.summary.failed++;
    }
    results.summary.total++;

    // Test 3: Check groups collection
    try {
        const groupsSnapshot = await adminDb.collection('groups').limit(5).get();
        results.checks.groups = {
            status: 'PASSED',
            count: groupsSnapshot.size,
            sample: groupsSnapshot.docs.map(d => ({
                id: d.id,
                name: d.data().groupName || d.data().name,
                memberCount: d.data().members?.length || 0
            }))
        };
        results.summary.passed++;
    } catch (error: any) {
        results.checks.groups = { status: 'FAILED', error: error.message };
        results.summary.failed++;
    }
    results.summary.total++;

    // Test 4: Check activities collection
    try {
        const activitiesSnapshot = await adminDb.collection('activities').limit(5).get();
        results.checks.activities = {
            status: 'PASSED',
            count: activitiesSnapshot.size,
            sample: activitiesSnapshot.docs.map(d => ({
                id: d.id,
                title: d.data().title,
                status: d.data().status
            }))
        };
        results.summary.passed++;
    } catch (error: any) {
        results.checks.activities = { status: 'FAILED', error: error.message };
        results.summary.failed++;
    }
    results.summary.total++;

    // Test 5: Check chats collection
    try {
        const chatsSnapshot = await adminDb.collection('chats').limit(5).get();
        results.checks.chats = {
            status: 'PASSED',
            count: chatsSnapshot.size,
            sample: chatsSnapshot.docs.map(d => ({
                id: d.id,
                members: d.data().members
            }))
        };
        results.summary.passed++;
    } catch (error: any) {
        results.checks.chats = { status: 'FAILED', error: error.message };
        results.summary.failed++;
    }
    results.summary.total++;

    // Test 6: Test write operation (create and delete a test post)
    try {
        const testPost = {
            authorId: 'test-verification',
            content: 'Verification test post',
            media: [],
            authenticityType: 'Live Post' as const,
            likes: 0,
            comments: 0,
            timestamp: new Date(),
            createdAt: new Date()
        };

        const docRef = await adminDb.collection('posts').add(testPost);
        await adminDb.collection('posts').doc(docRef.id).delete();

        results.checks.writeTest = {
            status: 'PASSED',
            message: 'Successfully created and deleted test post'
        };
        results.summary.passed++;
    } catch (error: any) {
        results.checks.writeTest = { status: 'FAILED', error: error.message };
        results.summary.failed++;
    }
    results.summary.total++;

    // Overall status
    results.overallStatus = results.summary.failed === 0 ? 'HEALTHY' : 'ISSUES_DETECTED';

    return NextResponse.json(results, {
        status: results.summary.failed === 0 ? 200 : 500
    });
}
