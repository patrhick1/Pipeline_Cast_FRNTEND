import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  Clock, 
  User, 
  Search,
  ChevronRight,
  TrendingUp,
  BookOpen
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  featured_image?: string;
  author: {
    name: string;
    avatar?: string;
  };
  tags: string[];
  published_at: string;
  reading_time: number;
}

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Fetch blog posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts', searchQuery, selectedTag],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedTag) params.append('tag', selectedTag);
      
      const response = await apiRequest('GET', `/blog/posts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json() as Promise<BlogPost[]>;
    }
  });

  // Fetch popular tags
  const { data: tags } = useQuery({
    queryKey: ['blog-tags'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/blog/tags');
      if (!response.ok) return [];
      return response.json() as Promise<string[]>;
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Podcast Guest Launch Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Expert insights, tips, and strategies for landing more podcast interviews
            and growing your personal brand.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              <Badge
                variant={selectedTag === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedTag(null)}
              >
                All Topics
              </Badge>
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Featured Post */}
        {posts && posts.length > 0 && !searchQuery && !selectedTag && (
          <Card className="max-w-4xl mx-auto mb-12 overflow-hidden">
            <div className="md:flex">
              {posts[0].featured_image && (
                <div className="md:w-1/2">
                  <img
                    src={posts[0].featured_image}
                    alt={posts[0].title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="p-6 md:w-1/2">
                <Badge className="mb-4">Featured</Badge>
                <h2 className="text-2xl font-bold mb-3">
                  {posts[0].title}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {posts[0].excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {posts[0].author.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(posts[0].published_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {posts[0].reading_time} min read
                  </span>
                </div>
                <Link href={`/blog/${posts[0].slug}`}>
                  <Button>
                    Read Article
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts?.slice(searchQuery || selectedTag ? 0 : 1).map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              {post.featured_image && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex flex-wrap gap-2 mb-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {post.author.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.reading_time} min
                  </span>
                </div>
                <Link href={`/blog/${post.slug}`}>
                  <Button variant="outline" className="w-full">
                    Read More
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {posts && posts.length === 0 && (
          <Card className="max-w-2xl mx-auto text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No articles found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedTag
                  ? "Try adjusting your search or filters"
                  : "Check back soon for new content!"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Newsletter CTA */}
        <Card className="max-w-4xl mx-auto mt-16 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">
              Get Podcast Guesting Tips Delivered
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join our newsletter for weekly insights on landing more podcast interviews,
              crafting compelling pitches, and growing your authority.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
              />
              <Button>Subscribe</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}