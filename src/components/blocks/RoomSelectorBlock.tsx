import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { RoomSelectorBlock as RoomSelectorBlockType, Media, Room } from '@/payload-types'
import { RoomSelectorClient, type RoomData } from './RoomSelectorClient'

function isMedia(value: Media | number | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

function isRoom(value: number | Room): value is Room {
  return typeof value === 'object' && value !== null
}

async function getRooms(block: RoomSelectorBlockType, locale: string): Promise<Room[]> {
  const selected = (block.rooms ?? []).filter(isRoom)
  if (selected.length > 0) return selected

  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'rooms',
      locale: locale as 'pl' | 'en',
      sort: 'order',
      depth: 1,
      limit: 100,
    })
    return docs
  } catch {
    return []
  }
}

function toRoomData(room: Room): RoomData {
  return {
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    description: room.description,
    equipment: (room.equipment ?? [])
      .map((e) => e.item)
      .filter((item): item is string => Boolean(item)),
    gallery: (room.gallery ?? [])
      .map((g) => (isMedia(g.image) && g.image.url ? { url: g.image.url, alt: g.image.alt || room.name } : null))
      .filter((g): g is { url: string; alt: string } => g !== null),
  }
}

export async function RoomSelectorBlock({
  block,
  locale,
}: {
  block: RoomSelectorBlockType
  locale: string
}) {
  const rooms = await getRooms(block, locale)

  if (rooms.length === 0) return null

  const roomData = rooms.map(toRoomData)
  const offerItems = (block.offerItems ?? [])
    .map((o) => o.item)
    .filter((item): item is string => Boolean(item))

  return (
    <RoomSelectorClient
      rooms={roomData}
      heading={block.heading}
      equipmentHeading={block.equipmentHeading}
      offerHeading={block.offerHeading}
      offerItems={offerItems}
      locale={locale}
    />
  )
}
