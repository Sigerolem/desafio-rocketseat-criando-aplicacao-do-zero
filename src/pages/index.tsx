import { GetStaticProps } from 'next';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home(props: HomeProps): JSX.Element {
  const { postsPagination } = props;

  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function loadMorePosts(): Promise<void> {
    const response = await fetch(nextPage);
    const result = await response.json();
    setNextPage(result.next_page);
    setPosts(prevState => [...prevState, ...result.results]);
  }

  return (
    <main>
      {posts.map(post => (
        <Link key={post.uid} href={`/post/${post.uid}`}>
          <div>
            <h1>{post.data.title}</h1>
            <p>{post.data.subtitle}</p>
            <div>
              <span>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </span>
              <span>{post.data.author}</span>
            </div>
          </div>
        </Link>
      ))}

      {nextPage !== null && (
        <button
          onClick={async () => {
            await loadMorePosts();
          }}
          type="button"
        >
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', { pageSize: 1 });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsResponse.results,
      },
    },
    revalidate: 5,
  };
};
