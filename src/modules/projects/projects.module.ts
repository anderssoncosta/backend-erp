import { Module } from '@nestjs/common';
import { ProjectsController } from './presentation/controllers/projects.controller';

@Module({
  controllers: [ProjectsController],
  providers: [],
})
export class ProjectsModule {}
