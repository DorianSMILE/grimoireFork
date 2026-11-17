package generation.grimoire.entity;

import generation.grimoire.enumeration.AnomalieCategory;
import generation.grimoire.enumeration.AnomalieType;
import generation.grimoire.enumeration.SpiritualiteType;
import generation.grimoire.entity.auth.AppUser;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "Anomalie", indexes = {
    @Index(name = "idx_anomalie_owner", columnList = "ownerUsername"),
    @Index(name = "idx_anomalie_template", columnList = "is_template"),
    @Index(name = "idx_anomalie_name", columnList = "name")
})
public class Anomalie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SpiritualiteType spiritualite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(255) default 'AUTRE'")
    private AnomalieCategory category = AnomalieCategory.AUTRE;

    private String ownerUsername;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private Integer level = 1;

    @Convert(converter = generation.grimoire.entity.converter.AnomalieTypeConverter.class)
    @Column(nullable = false, columnDefinition = "varchar(32) default 'MAGIQUE'")
    private AnomalieType anomalieType = AnomalieType.MAGIQUE;

    @com.fasterxml.jackson.annotation.JsonProperty(value = "magicObject", access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    public boolean isMagicObject() {
        return this.anomalieType == AnomalieType.MAGIQUE;
    }

    @JsonIgnore
    public void setMagicObject(boolean magicObject) {
        if (this.anomalieType == null || this.anomalieType == AnomalieType.MAGIQUE || this.anomalieType == AnomalieType.MATERIAU) {
            this.anomalieType = magicObject ? AnomalieType.MAGIQUE : AnomalieType.MATERIAU;
        }
    }

    @Column(name = "is_template", nullable = false)
    private boolean isTemplate = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private AppUser user;

    @Transient
    private java.util.List<generation.grimoire.dto.equipment.DungeonDropSourceDTO> dungeonSources = new java.util.ArrayList<>();

    @Transient
    private java.util.List<String> alchemyRecipes = new java.util.ArrayList<>();
}
