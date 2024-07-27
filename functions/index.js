const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.onPostCreate = functions.firestore
    .document('posts/{postId}')
    .onCreate(async (snap, context) => {
        const newPost = snap.data();
        const postTitle = newPost.title;

        const postsCountsRef = admin.firestore().collection('postsCounts');
        const postCountDoc = await postsCountsRef.doc(postTitle).get();

        if (!postCountDoc.exists) {
            await postsCountsRef.doc(postTitle).set({ count: 1 });
        } else {
            const count = postCountDoc.data().count + 1;
            await postsCountsRef.doc(postTitle).update({ count });
        }
    });


const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

exports.createPost = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { title, description } = req.body;
    const creationDate = admin.firestore.FieldValue.serverTimestamp();

    const postsRef = admin.firestore().collection('posts');
    const newPostRef = await postsRef.add({ title, description, creationDate });

    res.status(201).send({ id: newPostRef.id });
});

exports.getAllPosts = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    const postsRef = admin.firestore().collection('posts');
    const snapshot = await postsRef.get();

    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).send(posts);
});

exports.getPost = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    const { postId } = req.params;
    const postRef = admin.firestore().collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
        return res.status(404).send('Post Not Found');
    }

    res.status(200).send(postDoc.data());
});

exports.updatePost = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { postId } = req.params;
    const { title, description } = req.body;

    const postRef = admin.firestore().collection('posts').doc(postId);
    await postRef.update({ title, description });

    const updatedPostDoc = await postRef.get();
    res.status(200).send(updatedPostDoc.data());
});

exports.deletePost = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'DELETE') {
        return res.status(405).send('Method Not Allowed');
    }

    const { postId } = req.params;
    const postRef = admin.firestore().collection('posts').doc(postId);

    await postRef.delete();
    res.status(200).send('Post Deleted');
});

