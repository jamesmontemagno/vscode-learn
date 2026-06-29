export interface LearnCatalog {
  readonly source: CatalogSource;
  readonly courses: readonly LearnCourse[];
}

export interface CatalogSource {
  readonly repository: string;
  readonly branch: string;
  readonly tocUrl: string;
  readonly generatedAt?: string;
  readonly fetchedAt?: string;
  readonly etag?: string;
}

export interface LearnCourse {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly area: string;
  readonly order: number;
  readonly lessons: readonly LearnLesson[];
}

export interface LearnLesson {
  readonly id: string;
  readonly courseId: string;
  readonly title: string;
  readonly area: string;
  readonly slug: string;
  readonly order: number;
  readonly sourcePath: string;
  readonly canonicalUrl: string;
  readonly rawMarkdownUrl: string;
}

export function getAllLessons(catalog: LearnCatalog): LearnLesson[] {
  return catalog.courses.flatMap(course => [...course.lessons]);
}

export function findLesson(catalog: LearnCatalog, lessonId: string): LearnLesson | undefined {
  return getAllLessons(catalog).find(lesson => lesson.id === lessonId);
}
