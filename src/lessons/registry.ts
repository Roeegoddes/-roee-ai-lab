/*
  Lesson registry: finds lessons automatically.

  Every folder in src/lessons/ with a meta.ts and lesson.mdx is a lesson;
  its folder name is its URL slug (/lessons/<folder>). Folders starting
  with "_" (like _template) are ignored.
*/
import type { ComponentType } from 'react'
import type { LessonMeta } from './types'

const metas = import.meta.glob<{ meta: LessonMeta }>(
  ['./*/meta.ts', '!./_*/meta.ts'],
  { eager: true },
)
const contents = import.meta.glob<{ default: ComponentType }>(
  ['./*/lesson.mdx', '!./_*/lesson.mdx'],
)

export interface Lesson extends LessonMeta {
  slug: string
  load: () => Promise<{ default: ComponentType }>
}

const folderOf = (path: string) => path.split('/')[1] ?? ''

export const lessons: Lesson[] = Object.entries(metas)
  .flatMap(([path, mod]) => {
    const folder = folderOf(path)
    const load = contents[`./${folder}/lesson.mdx`]
    return load ? [{ ...mod.meta, slug: folder, load }] : []
  })
  .sort((a, b) => a.order - b.order)

export const getLesson = (slug: string) => lessons.find((l) => l.slug === slug)
