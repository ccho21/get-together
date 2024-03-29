import {
  Component,
  OnInit,
  OnChanges,
  Input,
  EventEmitter,
  Output,
  ChangeDetectionStrategy,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { FileItem, FileUploader } from 'ng2-file-upload';
import { environment } from 'src/environments/environment';
import { AccountService } from 'src/app/_services/account.service';
import { User } from 'src/app/_models/user';
import { take } from 'rxjs/operators';
import { Photo } from 'src/app/_models/photo';

import {
  Gallery,
  GalleryItem,
  ThumbnailsPosition,
  ImageSize,
} from 'ng-gallery';
import { Lightbox } from 'ng-gallery/lightbox';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-photo-upload',
  templateUrl: './photo-upload.component.html',
  styleUrls: ['./photo-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoUploadComponent implements OnInit, OnDestroy {
  uploader?: FileUploader;
  user?: User;
  userSub$?: Subscription;

  @Input() photos?: Photo[];
  @Input() photo?: Photo;

  @Input() single?: boolean;

  @Output() setMain: EventEmitter<Photo> = new EventEmitter<Photo>();
  @Output() delete: EventEmitter<number> = new EventEmitter<number>();
  @Output() updatePhoto: EventEmitter<Photo> = new EventEmitter<Photo>();
  @Output() fileUploader: EventEmitter<FileUploader> =
    new EventEmitter<FileUploader>();

  hasBaseDropzoneOver = false;
  baseUrl = environment.apiUrl;
  updatedPhotos?: Array<Photo | Partial<Photo>>;

  //
  previewPath?: any;
  items: GalleryItem[] = [];
  imageData: any = [];

  //

  constructor(
    private accountService: AccountService,
    public gallery: Gallery,
    public lightbox: Lightbox,
    private sanitizer: DomSanitizer
  ) {
    this.userSub$ = this.accountService.currentUser$
      .pipe(take(1))
      .subscribe((user) => (this.user = user as User));
  }

  ngOnInit(): void {
    const lightboxRef = this.gallery.ref('lightbox');

    // Add custom gallery config to the lightbox (optional)
    lightboxRef.setConfig({
      imageSize: ImageSize.Cover,
      thumbPosition: ThumbnailsPosition.Top,
    });

    // Load items into the lightbox gallery ref
    lightboxRef.load(this.items);

    this.initUploader();
    console.log('### this uploader', this.uploader);
  }

  ngOnDestroy(): void {
    this.userSub$!.unsubscribe();
  }
  
  initUploader() {
    this.initializeUploader();
    this.updatedPhotos = [];
    if (this.photos) {
      this.updatedPhotos = this.photos?.slice();
    } else if (this.photo) {
      this.updatedPhotos.push(JSON.parse(JSON.stringify(this.photo)));
    } else {
      this.updatedPhotos = [];
    }
  }

  getGalerryPhotos() {
    return this.photos?.map((photo: Photo) => ({
      id: photo.id,
      srcUrl: photo.url,
      previewUrl: photo.url,
    }));
  }

  initializeUploader() {
    console.log('## initializeUploader');

    let url = '';

    this.uploader = new FileUploader({
      url: url,
      authToken: 'Bearer ' + this.user?.token,
      isHTML5: true,
      allowedFileType: ['image'],
      removeAfterUpload: true,
      autoUpload: false,
      maxFileSize: 10 * 1024 * 1024,
    });

    this.uploader.onAfterAddingFile = (file) => {
      console.log('## onAfterAddingFile');

      file.withCredentials = false;

      if (this.uploader) {
        const previewImages: Partial<Photo>[] = this.uploader?.queue.map(
          (q) => {
            return this.getPreviewImages(q);
          }
        );

        this.updatedPhotos = previewImages.slice();
        if (this.photos) {
          this.updatedPhotos = [...this.updatedPhotos, ...this.photos];
        }
      }
    };

    this.uploader.onSuccessItem = (item, response, status, headers) => {
      console.log('## onSuccessItem', response);

      const photo: Photo = JSON.parse(response);
      if (this.photos && this.photos.length) {
        this.photos?.push(photo);
        this.updatedPhotos = this.photos.slice();
      } else {
        this.photo = photo;
      }
      this.updatePhoto.emit(photo);
    };
  }

  updateUrl(url: string) {
    this.uploader?.queue.forEach((elem) => {
      elem.url = url;
    });
  }

  uploadAll() {
    if (this.uploader && this.uploader.queue) {
      this.uploader.uploadAll();
    }
  }

  removeAll() {
    this.updatedPhotos = this.photos ? this.photos.slice() : [];
    this.uploader?.clearQueue();
  }

  getPreviewImages(queue: FileItem): Partial<Photo> {
    return {
      id: undefined,
      url: this.getSanitizedUrl(queue._file) as string,
      isMain: false,
    };
  }

  fileOverBase(e: any) {
    this.hasBaseDropzoneOver = e;
  }

  setMainPhoto(photo: Photo | Partial<Photo>) {
    this.setMain.emit(photo as Photo);
  }

  deletePhoto(photoId: number) {
    this.delete.emit(photoId);
  }

  getSanitizedUrl(file: File) {
    if (file) {
      let previewPath = this.sanitizer.bypassSecurityTrustUrl(
        window.URL.createObjectURL(file)
      );
      return previewPath;
    } else {
      return null;
    }
  }
}
