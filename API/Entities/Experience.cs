using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.Entities
{
    public class Experience
    {
        public int Id { get; set; }
        public string Intro { get; set; }
        public string Position { get; set; }
        public string CompanyName { get; set; }
        public string Url { get; set; }
        public string Skills { get; set; }
        public DateTime Started { get; set; }
        public bool IsCurrent { get; set; }
        public DateTime? Ended { get; set; }
        public AppUser AppUser { get; set; }
        public int AppUserId { get; set; }
        public ICollection<Photo> Logos { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedDate { get; set; }
        public ICollection<JobDescription> JobDescriptions { get; set; }
    }
}