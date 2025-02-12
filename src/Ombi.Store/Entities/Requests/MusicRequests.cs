﻿using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ombi.Store.Entities.Requests
{
    [Table("MusicRequests")]
    public class MusicRequests : BaseRequest
    {
        public string ForeignAlbumId { get; set; }
        public string ForeignArtistId { get; set; }
        public string Disk { get; set; }
        public string Cover { get; set; }
        public decimal Rating { get; set; }
        public DateTime ReleaseDate { get; set; }
        public string ArtistName { get; set; }
        [NotMapped]
        public bool Subscribed { get; set; }
        [NotMapped]
        public bool ShowSubscribe { get; set; }
        public bool Monitored { get; set; }
        public string Monitor { get; set; }
        public bool SearchForMissingAlbums { get; set; }

        
        [NotMapped]
        public string RequestStatus {
            get
            {
                if (Available)
                {
                    return "Common.Available";
                }

                if (Denied ?? false)
                {
                    return "Common.Denied";
                }

                if (Approved & !Available)
                {
                    return "Common.ProcessingRequest";
                }

                if (!Approved && !Available)
                {
                    return "Common.PendingApproval";
                }

                return string.Empty;
            }
        }
    }
}