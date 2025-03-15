# School Management System - Database Schema Design

## Overview
This document outlines the database schema design for the School Management System application. Based on our technology stack selection of MongoDB as the primary database, we'll define document schemas for each microservice.

## Database Architecture

We'll implement a database-per-service pattern, where each microservice has its own dedicated database. This approach:
- Ensures service independence
- Prevents tight coupling
- Allows services to evolve independently
- Supports the bounded context pattern from Domain-Driven Design

## User Management Service Database

### Collections

#### Users
```json
{
  "_id": "ObjectId",
  "username": "String",
  "email": "String",
  "passwordHash": "String",
  "firstName": "String",
  "lastName": "String",
  "role": "String (enum: 'admin', 'teacher', 'student')",
  "avatar": "String (URL)",
  "status": "String (enum: 'active', 'inactive', 'suspended')",
  "lastLogin": "Date",
  "createdAt": "Date",
  "updatedAt": "Date",
  "preferences": {
    "theme": "String",
    "notifications": "Boolean",
    "language": "String"
  },
  "contactInfo": {
    "phone": "String",
    "address": "String",
    "city": "String",
    "state": "String",
    "zipCode": "String",
    "country": "String"
  }
}
```

#### Roles
```json
{
  "_id": "ObjectId",
  "name": "String",
  "description": "String",
  "permissions": ["String"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Sessions
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: Users)",
  "token": "String",
  "ipAddress": "String",
  "userAgent": "String",
  "expiresAt": "Date",
  "createdAt": "Date"
}
```

## Class Management Service Database

### Collections

#### Classes
```json
{
  "_id": "ObjectId",
  "name": "String",
  "description": "String",
  "subject": "String",
  "gradeLevel": "String",
  "teacherId": "String (ref: Users from User Service)",
  "startDate": "Date",
  "endDate": "Date",
  "schedule": [{
    "dayOfWeek": "Number (0-6)",
    "startTime": "String (HH:MM)",
    "endTime": "String (HH:MM)",
    "location": "String"
  }],
  "capacity": "Number",
  "enrollmentCount": "Number",
  "status": "String (enum: 'active', 'upcoming', 'completed', 'cancelled')",
  "createdAt": "Date",
  "updatedAt": "Date",
  "tags": ["String"]
}
```

#### Enrollments
```json
{
  "_id": "ObjectId",
  "classId": "ObjectId (ref: Classes)",
  "studentId": "String (ref: Users from User Service)",
  "enrollmentDate": "Date",
  "status": "String (enum: 'active', 'dropped', 'completed')",
  "grade": "String",
  "attendance": [{
    "date": "Date",
    "status": "String (enum: 'present', 'absent', 'late', 'excused')",
    "notes": "String"
  }],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Content Management Service Database

### Collections

#### ContentItems
```json
{
  "_id": "ObjectId",
  "title": "String",
  "description": "String",
  "type": "String (enum: 'document', 'video', 'image', 'link', 'assignment')",
  "content": "String (HTML or Markdown for documents, URL for others)",
  "authorId": "String (ref: Users from User Service)",
  "classId": "ObjectId (ref: Classes from Class Service)",
  "tags": ["String"],
  "status": "String (enum: 'draft', 'published', 'archived')",
  "publishDate": "Date",
  "dueDate": "Date (for assignments)",
  "version": "Number",
  "previousVersions": [{
    "content": "String",
    "updatedAt": "Date",
    "updatedBy": "String (ref: Users from User Service)"
  }],
  "attachments": [{
    "name": "String",
    "fileType": "String",
    "fileSize": "Number",
    "url": "String"
  }],
  "createdAt": "Date",
  "updatedAt": "Date",
  "metadata": {
    "duration": "Number (for videos)",
    "pageCount": "Number (for documents)",
    "dimensions": "String (for images)"
  }
}
```

#### ContentModules
```json
{
  "_id": "ObjectId",
  "title": "String",
  "description": "String",
  "classId": "ObjectId (ref: Classes from Class Service)",
  "contentItems": ["ObjectId (ref: ContentItems)"],
  "order": "Number",
  "status": "String (enum: 'draft', 'published', 'archived')",
  "createdAt": "Date",
  "updatedAt": "Date",
  "createdBy": "String (ref: Users from User Service)"
}
```

## Communication Hub Database

### Collections

#### Messages
```json
{
  "_id": "ObjectId",
  "senderId": "String (ref: Users from User Service)",
  "recipientId": "String (ref: Users from User Service)",
  "subject": "String",
  "content": "String",
  "read": "Boolean",
  "readAt": "Date",
  "attachments": [{
    "name": "String",
    "fileType": "String",
    "fileSize": "Number",
    "url": "String"
  }],
  "createdAt": "Date"
}
```

#### Announcements
```json
{
  "_id": "ObjectId",
  "title": "String",
  "content": "String",
  "authorId": "String (ref: Users from User Service)",
  "targetAudience": {
    "type": "String (enum: 'all', 'class', 'role')",
    "classId": "ObjectId (ref: Classes from Class Service)",
    "role": "String (enum: 'admin', 'teacher', 'student')"
  },
  "priority": "String (enum: 'low', 'medium', 'high')",
  "startDate": "Date",
  "endDate": "Date",
  "attachments": [{
    "name": "String",
    "fileType": "String",
    "fileSize": "Number",
    "url": "String"
  }],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Notifications
```json
{
  "_id": "ObjectId",
  "userId": "String (ref: Users from User Service)",
  "title": "String",
  "message": "String",
  "type": "String (enum: 'info', 'warning', 'error', 'success')",
  "relatedTo": {
    "type": "String (enum: 'message', 'announcement', 'content', 'class')",
    "id": "String (reference to related item)"
  },
  "read": "Boolean",
  "readAt": "Date",
  "createdAt": "Date"
}
```

## AI-Enhanced Learning Assistant Database

### Collections

#### StudentActivities
```json
{
  "_id": "ObjectId",
  "studentId": "String (ref: Users from User Service)",
  "contentId": "ObjectId (ref: ContentItems from Content Service)",
  "classId": "ObjectId (ref: Classes from Class Service)",
  "activityType": "String (enum: 'view', 'download', 'submit', 'comment')",
  "duration": "Number (seconds)",
  "completionStatus": "String (enum: 'started', 'in-progress', 'completed')",
  "createdAt": "Date"
}
```

#### LearningPaths
```json
{
  "_id": "ObjectId",
  "studentId": "String (ref: Users from User Service)",
  "classId": "ObjectId (ref: Classes from Class Service)",
  "recommendedContent": [{
    "contentId": "ObjectId (ref: ContentItems from Content Service)",
    "reason": "String",
    "priority": "Number",
    "status": "String (enum: 'recommended', 'viewed', 'completed')"
  }],
  "learningStyle": "String (enum: 'visual', 'auditory', 'reading', 'kinesthetic')",
  "strengths": ["String"],
  "areasForImprovement": ["String"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Redis Schema Design

Redis will be used for:

### Caching
- User session data
- Frequently accessed content
- Class schedules

### Real-time Features
- Online user presence
- Notification delivery
- Real-time messaging

### Key Patterns

1. **Sessions**
   - Key: `session:{sessionId}`
   - Value: Session data JSON

2. **User Presence**
   - Key: `presence:{userId}`
   - Value: Status information with TTL

3. **Content Cache**
   - Key: `content:{contentId}`
   - Value: Content data JSON with expiration

4. **Notification Queues**
   - Key: `notifications:{userId}`
   - Value: List of pending notifications

5. **Rate Limiting**
   - Key: `ratelimit:{userId}:{endpoint}`
   - Value: Counter with TTL

## Database Indexing Strategy

### MongoDB Indexes

#### Users Collection
- `email`: Unique index
- `username`: Unique index
- `role`: Index for role-based queries

#### Classes Collection
- `teacherId`: Index for teacher's classes
- `status`: Index for filtering active classes
- `tags`: Index for tag-based searches

#### ContentItems Collection
- `classId`: Index for class content queries
- `authorId`: Index for author's content
- `type`: Index for content type filtering
- `tags`: Index for tag-based searches

#### Messages Collection
- `senderId`: Index for sent messages
- `recipientId`: Index for received messages
- `read`: Index for unread message filtering

#### StudentActivities Collection
- `studentId`: Index for student activity queries
- `contentId`: Index for content engagement metrics
- `createdAt`: Index for time-based queries

## Data Consistency Considerations

Since we're using a microservices architecture with separate databases, we need to address data consistency:

1. **Event-Based Synchronization**
   - Services will publish events when data changes
   - Other services can subscribe to relevant events
   - RabbitMQ will be used as the message broker

2. **Eventual Consistency**
   - Accept that data may be temporarily inconsistent
   - Design UI to handle potential inconsistencies
   - Implement background reconciliation processes

3. **Distributed Transactions**
   - For critical operations spanning multiple services
   - Implement saga pattern for complex transactions
   - Use compensating transactions for rollback

## Data Migration Strategy

For the initial prototype and future updates:

1. **Schema Versioning**
   - Include schema version in documents
   - Support multiple schema versions during transition

2. **Migration Scripts**
   - Create scripts for automated migrations
   - Run migrations during off-peak hours

3. **Backup Strategy**
   - Regular database backups
   - Point-in-time recovery options

## Next Steps

With the database schema defined, we will proceed to:
1. Set up the MongoDB and Redis instances
2. Implement the data models in our Node.js services
3. Create initial seed data for development
4. Implement the core service functionality
