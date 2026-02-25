const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    console.log('Start seeding ...');

    // Clean up existing data
    await prisma.activity.deleteMany();
    await prisma.review.deleteMany();
    await prisma.listItem.deleteMany();
    await prisma.list.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();

    // Create Users
    const password = await bcrypt.hash('password123', 10);

    const yunus = await prisma.user.create({
        data: {
            username: 'yunus',
            email: 'yunus@example.com',
            password,
            avatar: 'https://ui-avatars.com/api/?name=Yunus&background=0D8ABC&color=fff',
            bio: 'Full stack developer and movie enthusiast.',
        },
    });

    const alice = await prisma.user.create({
        data: {
            username: 'alice_wonder',
            email: 'alice@example.com',
            password,
            avatar: 'https://i.pravatar.cc/150?u=alice',
            bio: 'Bookworm and sci-fi lover.',
        },
    });

    const bob = await prisma.user.create({
        data: {
            username: 'bob_builder',
            email: 'bob@example.com',
            password,
            avatar: 'https://i.pravatar.cc/150?u=bob',
            bio: 'Action movie buff.',
        },
    });

    console.log('Users created.');

    // Create Follows
    await prisma.follow.create({
        data: {
            followerId: yunus.id,
            followingId: alice.id,
        },
    });

    await prisma.follow.create({
        data: {
            followerId: yunus.id,
            followingId: bob.id,
        },
    });

    console.log('Follows created.');

    // Create Activities
    // Alice rates Inception
    await prisma.activity.create({
        data: {
            userId: alice.id,
            type: 'RATING',
            mediaId: '27205', // Inception TMDb ID
            mediaType: 'Movie',
            mediaTitle: 'Inception',
            mediaPoster: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
            rating: 9,
        },
    });

    // Bob reviews The Dark Knight
    await prisma.activity.create({
        data: {
            userId: bob.id,
            type: 'REVIEW',
            mediaId: '155', // The Dark Knight TMDb ID
            mediaType: 'Movie',
            mediaTitle: 'The Dark Knight',
            mediaPoster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
            comment: 'Absolutely legendary performance by Heath Ledger. A must watch!',
        },
    });

    // Alice adds Dune to watchlist
    await prisma.activity.create({
        data: {
            userId: alice.id,
            type: 'ADD_TO_LIST',
            mediaId: '438631', // Dune TMDb ID
            mediaType: 'Movie',
            mediaTitle: 'Dune',
            mediaPoster: 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XFGE7XGI.jpg',
        },
    });

    // Yunus rates Interstellar
    await prisma.activity.create({
        data: {
            userId: yunus.id,
            type: 'RATING',
            mediaId: '157336', // Interstellar
            mediaType: 'Movie',
            mediaTitle: 'Interstellar',
            mediaPoster: 'https://image.tmdb.org/t/p/w500/gEU2QniL6C971PN66iwczz8zWWL.jpg',
            rating: 10,
        },
    });

    console.log('Activities created.');
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
