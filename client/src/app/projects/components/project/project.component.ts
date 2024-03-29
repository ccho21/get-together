import { Component, Input, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, iif } from 'rxjs';
import { concatMap, map, mergeMap, tap } from 'rxjs/operators';
import { Project } from 'src/app/_models/project';
import { ProjectService } from 'src/app/_services/project.service';
import SwiperCore, { Pagination, Navigation, SwiperOptions } from 'swiper';
SwiperCore.use([Navigation, Pagination]);

import {
  Gallery,
  GalleryItem,
  ThumbnailsPosition,
  ImageSize,
} from 'ng-gallery';
import { Lightbox } from 'ng-gallery/lightbox';
import { Photo } from 'src/app/_models/photo';
import { ProjectParams } from 'src/app/_models/projectParams';
import { PaginatedResult } from 'src/app/_models/pagination';
import { ScreenService } from 'src/app/_services/screen.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
})
export class ProjectComponent implements OnInit {
  project?: Project;
  otherProjects?: Project[];

  config: SwiperOptions = {
    slidesPerView: 1,
    spaceBetween: 50,
    navigation: false,
    pagination: { clickable: true, dynamicBullets: true },
    scrollbar: { draggable: true },
  };

  project$?: Observable<Project>;
  //
  items: GalleryItem[] = [];
  loading?: boolean;
  status = ['Planning', 'In Progress', 'Completed', 'On Hold', 'Stopped'];
  perSlide: number = 2;
  //

  constructor(
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    public gallery: Gallery,
    private screenService: ScreenService
  ) {}

  ngOnInit(): void {
    const lightboxRef = this.gallery.ref('lightbox');

    // Add custom gallery config to the lightbox (optional)
    lightboxRef.setConfig({
      imageSize: ImageSize.Cover,
      thumbPosition: ThumbnailsPosition.Top,
    });

    // Load items into the lightbox gallery ref
    lightboxRef.load(this.items);

    this.route.params.subscribe((params) => {
      const projectId = parseInt(params['id'], 10);

      if (!isNaN(projectId)) {
        this.loading = true;

        this.projectService
          .getProject(projectId)
          .pipe(
            concatMap((project: Project) => {
              this.project = project;
              const { user } = project;
              const params: ProjectParams =
                this.projectService.getProjectParams();
              params.currentUsername = user.username;
              return this.projectService.getProjects(params);
            })
          )
          .subscribe({
            next: (res: PaginatedResult<Project[]>) => {
              this.otherProjects = res.result?.filter(
                (x) => x.id !== projectId
              );

              this.projectService.resetProjectParams();
            },
            complete: () => {
              this.loading = false;
            },
          });
      } else {
        this.router.navigate(['main', 'projects']);
      }
    });

    this.getSlideView();
  }

  getSlideView() {
    return this.screenService.isBelowMd().subscribe((res) => {
      if (res.matches) {
        this.perSlide = 1;
      } else {
        this.perSlide = 2;
      }
    });
  }

  getGalerryPhotos() {
    return this.project?.images?.map((photo: Photo) => ({
      id: photo.id,
      srcUrl: photo.url,
      previewUrl: photo.url,
    }));
  }

  private getProject(id: number): void {
    this.projectService.getProject(id).subscribe((project) => {
      this.project = project;
    });
  }

  parseSkills(skills: string): Array<string> {
    if (skills && skills.length) {
      return skills.split(',');
    } else {
      return ['', ''];
    }
  }

  goBack() {
    this.router.navigate(['main', 'projects']);
  }

  getStatus(status: number) {
    return this.status[status];
  }
}
