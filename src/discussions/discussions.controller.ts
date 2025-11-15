import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DiscussionsService } from './discussions.service';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { AddOperationDto } from './dto/add-operation.dto';

@Controller('discussions')
export class DiscussionsController {
    constructor(private discussionsService: DiscussionsService) { }

    @Get()
    async getAllDiscussions(@Request() req) {
        console.log('GET /discussions hit. User:', req.user);
        return this.discussionsService.getAllDiscussions();
    }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    async createDiscussion(@Request() req, @Body() createDiscussionDto: CreateDiscussionDto) {
        return this.discussionsService.createDiscussion(req.user.userId, createDiscussionDto);
    }

    @Post('operation')
    @UseGuards(AuthGuard('jwt'))
    async addOperation(@Request() req, @Body() addOperationDto: AddOperationDto) {
        return this.discussionsService.addOperation(req.user.userId, addOperationDto);
    }
}
