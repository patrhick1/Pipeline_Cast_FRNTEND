import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowLeft,
  Share2,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  tags: string[];
  published_at: string;
  updated_at?: string;
  reading_time: number;
  meta_description?: string;
}

export default function BlogPost() {
  const { slug } = useParams();
  const { toast } = useToast();

  // Fetch single blog post
  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const response = await apiRequest('GET', `/blog/posts/${slug}`);
      if (!response.ok) throw new Error('Failed to fetch post');
      return response.json() as Promise<BlogPost>;
    },
    enabled: !!slug
  });

  // Fetch related posts
  const { data: relatedPosts } = useQuery({
    queryKey: ['related-posts', slug],
    queryFn: async () => {
      const response = await apiRequest('GET', `/blog/posts/${slug}/related`);
      if (!response.ok) return [];
      return response.json() as Promise<BlogPost[]>;
    },
    enabled: !!slug
  });

  const shareUrl = `${window.location.origin}/blog/${slug}`;

  const handleShare = (platform: string) => {
    let url = '';
    const text = post?.title || '';

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "The article link has been copied to your clipboard."
        });
        return;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-6 w-3/4 mb-8" />
        <Skeleton className="h-64 w-full mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Article not found</h1>
        <Link href="/blog">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link href="/blog">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          
          <p className="text-xl text-muted-foreground mb-6">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {post.author.avatar && (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span>{post.author.name}</span>
            </div>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.reading_time} min read
            </span>
          </div>
        </header>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-lg max-w-none mb-12">
          <MarkdownRenderer content={post.content} />
        </div>

        <Separator className="my-8" />

        {/* Share Buttons */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-semibold">Share this article</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShare('twitter')}
            >
              <Twitter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShare('linkedin')}
            >
              <Linkedin className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShare('copy')}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Author Bio */}
        {post.author.bio && (
          <Card className="mb-12">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {post.author.avatar && (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="h-16 w-16 rounded-full"
                  />
                )}
                <div>
                  <h3 className="font-semibold mb-2">About {post.author.name}</h3>
                  <p className="text-muted-foreground">{post.author.bio}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold mb-6">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.slice(0, 2).map((relatedPost) => (
                <Card key={relatedPost.id} className="hover:shadow-lg transition-shadow">
                  {relatedPost.featured_image && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={relatedPost.featured_image}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-2 line-clamp-2">
                      {relatedPost.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                    <Link href={`/blog/${relatedPost.slug}`}>
                      <Button variant="ghost" className="p-0 h-auto">
                        Read More
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Newsletter CTA */}
        <Card className="mt-12 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="text-center py-8">
            <h3 className="text-xl font-bold mb-3">
              Want more podcast guesting insights?
            </h3>
            <p className="text-muted-foreground mb-4">
              Subscribe to our newsletter for weekly tips and strategies.
            </p>
            <Button>Subscribe to Newsletter</Button>
          </CardContent>
        </Card>
      </div>
    </article>
  );
}