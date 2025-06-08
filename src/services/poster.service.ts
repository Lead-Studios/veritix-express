import pool from '../config/database';
import type {
  Poster,
  CreatePosterDTO,
  UpdatePosterDTO,
} from '../types/poster.types';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export class PosterService {
  async createPoster(
    posterData: CreatePosterDTO,
    imageUrl: string,
    uploadedBy: string
  ): Promise<Poster> {
    const client = await pool.connect();

    try {
      const eventCheck = await client.query(
        'SELECT id FROM events WHERE id = $1',
        [posterData.eventId]
      );

      if (eventCheck.rows.length === 0) {
        throw new Error('Event not found');
      }

      const posterId = uuidv4();
      const now = new Date();

      const result = await client.query(
        `INSERT INTO posters (id, image_url, description, event_id, uploaded_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          posterId,
          imageUrl,
          posterData.description,
          posterData.eventId,
          uploadedBy,
          now,
          now,
        ]
      );

      return this.mapRowToPoster(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getAllPosters(
    page = 1,
    limit = 10
  ): Promise<{
    posters: Poster[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const client = await pool.connect();

    try {
      const offset = (page - 1) * limit;

      const [postersResult, countResult] = await Promise.all([
        client.query(
          `SELECT p.*, e.title as event_title, u.email as uploader_email
           FROM posters p
           LEFT JOIN events e ON p.event_id = e.id
           LEFT JOIN users u ON p.uploaded_by = u.id
           ORDER BY p.created_at DESC
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        ),
        client.query('SELECT COUNT(*) FROM posters'),
      ]);

      const total = Number.parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      return {
        posters: postersResult.rows.map((row) => this.mapRowToPoster(row)),
        total,
        page,
        totalPages,
      };
    } finally {
      client.release();
    }
  }

  async getPosterById(id: string): Promise<Poster | null> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT p.*, e.title as event_title, u.email as uploader_email
         FROM posters p
         LEFT JOIN events e ON p.event_id = e.id
         LEFT JOIN users u ON p.uploaded_by = u.id
         WHERE p.id = $1`,
        [id]
      );

      return result.rows.length > 0
        ? this.mapRowToPoster(result.rows[0])
        : null;
    } finally {
      client.release();
    }
  }

  async getPostersByEventId(eventId: string): Promise<Poster[]> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT p.*, e.title as event_title, u.email as uploader_email
         FROM posters p
         LEFT JOIN events e ON p.event_id = e.id
         LEFT JOIN users u ON p.uploaded_by = u.id
         WHERE p.event_id = $1
         ORDER BY p.created_at DESC`,
        [eventId]
      );

      return result.rows.map((row) => this.mapRowToPoster(row));
    } finally {
      client.release();
    }
  }

  async updatePoster(
    id: string,
    updateData: UpdatePosterDTO,
    userId: string
  ): Promise<Poster | null> {
    const client = await pool.connect();

    try {
      const existingPoster = await client.query(
        'SELECT * FROM posters WHERE id = $1',
        [id]
      );

      if (existingPoster.rows.length === 0) {
        return null;
      }

      const userCheck = await client.query(
        `SELECT role FROM users WHERE id = $1`,
        [userId]
      );

      const userRole = userCheck.rows[0]?.role;
      const isOwner = existingPoster.rows[0].uploaded_by === userId;
      const hasPermission =
        isOwner || ['admin', 'organizer'].includes(userRole);

      if (!hasPermission) {
        throw new Error('Insufficient permissions to update this poster');
      }

      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (updateData.description !== undefined) {
        updateFields.push(`description = $${paramCount}`);
        updateValues.push(updateData.description);
        paramCount++;
      }

      if (updateData.eventId !== undefined) {
        const eventCheck = await client.query(
          'SELECT id FROM events WHERE id = $1',
          [updateData.eventId]
        );

        if (eventCheck.rows.length === 0) {
          throw new Error('Event not found');
        }

        updateFields.push(`event_id = $${paramCount}`);
        updateValues.push(updateData.eventId);
        paramCount++;
      }

      if (updateFields.length === 0) {
        return this.mapRowToPoster(existingPoster.rows[0]);
      }

      updateFields.push(`updated_at = $${paramCount}`);
      updateValues.push(new Date());
      updateValues.push(id);

      const result = await client.query(
        `UPDATE posters SET ${updateFields.join(', ')} WHERE id = $${
          paramCount + 1
        } RETURNING *`,
        updateValues
      );

      return this.mapRowToPoster(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async deletePoster(id: string, userId: string): Promise<boolean> {
    const client = await pool.connect();

    try {
      const existingPoster = await client.query(
        'SELECT * FROM posters WHERE id = $1',
        [id]
      );

      if (existingPoster.rows.length === 0) {
        return false;
      }

      const userCheck = await client.query(
        `SELECT role FROM users WHERE id = $1`,
        [userId]
      );

      const userRole = userCheck.rows[0]?.role;
      const isOwner = existingPoster.rows[0].uploaded_by === userId;
      const hasPermission =
        isOwner || ['admin', 'organizer'].includes(userRole);

      if (!hasPermission) {
        throw new Error('Insufficient permissions to delete this poster');
      }

      await client.query('DELETE FROM posters WHERE id = $1', [id]);

      try {
        const imagePath = path.join(
          process.cwd(),
          existingPoster.rows[0].image_url
        );
        await fs.unlink(imagePath);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }

      return true;
    } finally {
      client.release();
    }
  }

  private mapRowToPoster(row: any): Poster {
    return {
      id: row.id,
      imageUrl: row.image_url,
      description: row.description,
      eventId: row.event_id,
      uploadedBy: row.uploaded_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
