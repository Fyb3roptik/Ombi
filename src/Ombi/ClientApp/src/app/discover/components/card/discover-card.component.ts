import { Component, OnInit, Input } from "@angular/core";
import { IDiscoverCardResult } from "../../interfaces";
import { RequestType } from "../../../interfaces";
import { MessageService, RequestService, SearchV2Service } from "../../../services";
import { MatDialog } from "@angular/material/dialog";
import { IArtistRequestModel } from "../../../interfaces/IRequestModel";
import { IReleaseGroups } from "../../../interfaces/IMusicSearchResultV2";
import { ISearchTvResultV2 } from "../../../interfaces/ISearchTvResultV2";
import { ISearchMovieResultV2 } from "../../../interfaces/ISearchMovieResultV2";
import { EpisodeRequestComponent } from "../../../shared/episode-request/episode-request.component";
import { AdminRequestDialogComponent } from "../../../shared/admin-request-dialog/admin-request-dialog.component";
import { DiscoverType } from "../carousel-list/carousel-list.component";

@Component({
    selector: "discover-card",
    templateUrl: "./discover-card.component.html",
    styleUrls: ["./discover-card.component.scss"],
})
export class DiscoverCardComponent implements OnInit {

    @Input() public discoverType: DiscoverType;
    @Input() public result: IDiscoverCardResult;
    @Input() public isAdmin: boolean;
    public RequestType = RequestType;
    public hide: boolean;
    public fullyLoaded = false;
    public loading: boolean;

    public requestable: boolean;
    public monitored: boolean;

    // This data is needed to open the dialog
    private tvSearchResult: ISearchTvResultV2;
    private allAlbums: IReleaseGroups[] = [];

    constructor(private searchService: SearchV2Service, private dialog: MatDialog, private requestService: RequestService,
        public messageService: MessageService) { }

    public ngOnInit() {
        if (this.result.type == RequestType.tvShow) {
            this.fullyLoaded = true;
            this.getExtraTvInfo();
        }
        if (this.result.type == RequestType.movie) {
            this.getExtraMovieInfo();
        }
        if (this.result.type == RequestType.artist) {
            this.getArtistInformation();
        }
        if (this.result.type == RequestType.album) {
            this.getAlbumInformation();
        }
    }

    public async getExtraTvInfo() {
        this.tvSearchResult = await this.searchService.getTvInfoWithMovieDbId(+this.result.id);
        this.requestable = true;
        this.setTvDefaults(this.tvSearchResult);
        this.updateTvItem(this.tvSearchResult);
    }

    public async getArtistInformation() {
        this.searchService.getArtistInformation(this.result.id.toString()).subscribe(x => {
            if (x.poster) {
                this.result.posterPath = x.poster;
                this.fullyLoaded = true;
            } else {
                this.searchService.getReleaseGroupArt(this.result.id.toString()).subscribe(art => {
                    if (art.image) {
                        this.result.posterPath = art.image;

                    }
                })
            }
            this.result.title = x.name;
            this.result.overview = x.overview;
            this.fullyLoaded = true;
            if (x.monitored) {
                this.requestable = false;
                this.monitored = true;
            } else {
                this.requestable = true;
                this.monitored = false;
            }
        });
    }

    public async getAlbumInformation() {
        this.searchService.getAlbumInformation(this.result.id.toString()).subscribe(x => {
            if (x.cover) {
                this.result.posterPath = x.cover;
                this.fullyLoaded = true;
            }
            this.result.title = x.title;
            this.result.overview = x.overview;
            this.fullyLoaded = true;
            if (x.monitored) {
                this.requestable = false;
                this.monitored = true;
            } else {
                this.requestable = true;
                this.monitored = false;
            }
        });
    }

    public generateDetailsLink(): string {
        switch (this.result.type) {
            case RequestType.movie:
                return `/details/movie/${this.result.id}`;
            case RequestType.tvShow:
                return `/details/tv/${this.result.id}`;
            case RequestType.artist: //Actually artist
                return `/details/artist/${this.result.id}`;
            case RequestType.album: //Actually artist
                return `/details/album/${this.result.id}`;
        }
    }

    public getStatusClass(): string {
        if (this.result.available) {
            return "available";
        }
        if (this.result.approved) {
            return "approved";
        }
        if (this.result.requested) {
            return "requested";
        }
        return "";
    }

    public getAvailbilityStatus(): string {
        if (this.result.available) {
            return "Available";
        }
        if (this.result.approved) {
            return "Approved";
        }
        if (this.result.requested) {
            return "Pending";
        }
        return "";
    }

    public request(event: any) {
        event.preventDefault();
        this.loading = true;
        switch (this.result.type) {
            case RequestType.artist:
                this.requestService.requestArtist({ foreignArtistId: this.result.id.toString(), monitored: true, monitor: "all", searchForMissingAlbums: true }).subscribe(x => {
                    if (x.result) {
                        this.result.requested = true;
                        this.messageService.send(x.message, "Ok");
                    } else {
                        this.messageService.send(x.errorMessage, "Ok");
                    }
                    this.loading = false;
                });;
                return;
            case RequestType.tvShow:
                const dia = this.dialog.open(EpisodeRequestComponent, { width: "700px", data: { series: this.tvSearchResult, isAdmin: this.isAdmin }, panelClass: 'modal-panel' });
                dia.afterClosed().subscribe(x => this.loading = false);
                return;
            case RequestType.movie:
                if (this.isAdmin) {
                    const dialog = this.dialog.open(AdminRequestDialogComponent, { width: "700px", data: { type: RequestType.movie, id: this.result.id }, panelClass: 'modal-panel' });
                    dialog.afterClosed().subscribe((result) => {
                        if (result) {
                                this.requestService.requestMovie({ theMovieDbId: +this.result.id,
                                    languageCode: null,
                                    qualityPathOverride: result.radarrPathId,
                                    requestOnBehalf: result.username?.id,
                                    rootFolderOverride: result.radarrFolderId, }).subscribe(x => {
                                if (x.result) {
                                    this.result.requested = true;
                                    this.messageService.send(x.message, "Ok");
                                } else {
                                    this.messageService.send(x.errorMessage, "Ok");
                                }
                            });
                        }
                    });
                } else {
                this.requestService.requestMovie({ theMovieDbId: +this.result.id, languageCode: null, requestOnBehalf: null, qualityPathOverride: null, rootFolderOverride: null }).subscribe(x => {
                    if (x.result) {
                        this.result.requested = true;
                        this.messageService.send(x.message, "Ok");
                    } else {
                        this.messageService.send(x.errorMessage, "Ok");
                    }
                    this.loading = false;
                });
                return;
            }
        }
    }

    private getExtraMovieInfo() {
        if (!this.result.imdbid) {
            this.searchService.getFullMovieDetails(+this.result.id)
                .subscribe(m => {
                    this.updateMovieItem(m);
                });
        } else {
            this.fullyLoaded = true;
        }
        this.requestable = true;
    }

    private updateMovieItem(updated: ISearchMovieResultV2) {
        this.result.url = "http://www.imdb.com/title/" + updated.imdbId + "/";
        this.result.available = updated.available;
        this.result.requested = updated.requested;
        this.result.requested = updated.requestProcessing;
        this.result.rating = updated.voteAverage;
        this.result.overview = updated.overview;
        this.result.imdbid = updated.imdbId;

        this.fullyLoaded = true;
    }


    private setTvDefaults(x: ISearchTvResultV2) {
        if (x.imdbId) {
            x.imdbId = "http://www.imdb.com/title/" + x.imdbId + "/";
        } else {
            x.imdbId = "https://www.tvmaze.com/shows/" + x.seriesId;
        }
    }

    private updateTvItem(updated: ISearchTvResultV2) {
        this.result.title = updated.title;
        this.result.id = updated.id;
        // this.result.available = updated.fullyAvailable || updated.partlyAvailable;
        // this.result.posterPath = updated.banner;
        this.result.requested = updated.requested;
        this.result.url = updated.imdbId;
        this.result.overview = updated.overview;
        this.result.approved = updated.approved;
        this.result.available = updated.fullyAvailable;

        this.fullyLoaded = true;
    }

}
