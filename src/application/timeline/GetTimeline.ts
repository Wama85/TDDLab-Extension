import * as vscode from 'vscode';
import { Timeline } from '../../domain/timeline/Timeline';
import { CommitPoint } from '../../domain/timeline/CommitPoint';
import { TimelineRepository } from '../../application/timeline/repository/TimelineRepository';

export class GetTimeline  {
    private readonly timelineRepository: TimelineRepository;

    constructor(rootPath: string) {
        this.timelineRepository = new TimelineRepository(rootPath);        
    }

    async execute(): Promise<Array<Timeline | CommitPoint>> {
        let response: Array<Timeline | CommitPoint> = [];
        try {
            const timeline = await this.timelineRepository.getTimelines();
            response = timeline;
        } catch {
            vscode.window.showErrorMessage('Error al obtener la linea de tiempo.');
        }
        return response;
    }

}
