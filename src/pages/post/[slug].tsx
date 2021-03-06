import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

function calculateMinutesForReading({ data }: Post): string {
  const wordList = data.content.reduce(
    (previousItems, currentItem) =>
      previousItems +
      currentItem.heading +
      currentItem.body.reduce(
        (previousBody, currentBody) => previousBody + currentBody.text,
        ''
      ),
    ''
  );
  const wordCount = wordList.split(' ').length;
  return Math.ceil(wordCount / 200).toString();
}

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();
  const { data } = post;

  const minutesForReading = calculateMinutesForReading(post);

  return isFallback ? (
    <p>Carregando...</p>
  ) : (
    <>
      <Head>
        <title>{`spacetraveling: ${post.data.title}`}</title>
      </Head>
      <Header />
      {data.banner.url && (
        <img className={styles.banner} src={data.banner.url} alt="banner" />
      )}
      <main className={styles.container}>
        <h1>{data.title}</h1>
        <div className={commonStyles.postInfoContainer}>
          <FiCalendar />
          <span>
            {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
              locale: ptBR,
            })}
          </span>
          <FiUser />
          <span>{data.author}</span>
          <FiClock />
          <span>{minutesForReading} min</span>
        </div>
        <div>
          {data.content.map(content => (
            <div key={content.heading}>
              <h2>{content.heading}</h2>

              <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths<{ slug: string }> = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');
  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params as { slug: string };
  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', slug);

  return {
    props: {
      post: response,
    },
    revalidate: 60 * 5, // 5 minutos,
  };
};
