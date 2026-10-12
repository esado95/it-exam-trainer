# Реестр покрытия тренажёра

Дата проверки 12 октября 2026. Это учебный корпус, не официальный référentiel.
Прочитаны основной текст, все 7 таблиц, 4 изображения, доступные колонтитулы. Сноски и концевые сноски не содержат учебного текста. Постраничный рендер недоступен; номера страниц из оглавления и полей не используются.

SYS — Fiche revision systeme.docx, NET — Fiche revision reseau.docx, SEC — Fiche revision securite.docx.
P — порядковый номер XML-абзаца, включая пустые и абзацы внутри таблиц; это технический локатор, не номер страницы. Нумерация начинается в основном тексте. Диапазоны ниже относятся к основному тексту.

Все темы первоначально имеют статус «не проверено». Навыки для каждой темы: определение, различение, применение, диагностика, объяснение на французском — пока не проверены.

| ID | Содержание и источник | Глубина и границы |
|---|---|---|
| SYS-01 | Infrastructure → Raid, Sauvegarde; P28–39. RAID 0/1/5, типы копий, 3-2-1-1-0 | Краткие определения; расчёты и восстановление — вывод из материала с явно заданными условиями |
| SYS-02 | Windows Serveur; P40–52. Fichiers, FTP, IIS, DFS, DHCP, DNS, Hyper-V, SCVMM, AD DS, WDS/MDT, WSUS, RDP | Роли перечислены, подробной настройки нет |
| SYS-03 | Virtualisation, Cluster, HCI, Client léger; P54–87, таблица 1; Scalabilité P308–311 | Обзор типов гипервизоров, active/active, active/passive, PRA/PCA/MCO/MCS, сессий и VDI; quorum требует исправления |
| SYS-04 | Les différents types de stockage P88–91; NFS/iSCSI P288–292 | DAS/NAS/SAN, LUN/target; файловый/блочный доступ — техническое уточнение; конкурентная запись требует условий |
| SYS-05 | Téléphonie P93–102 | IPBX, SIP, RTP, VoIP/ToIP, G.711/G.729; связь с gigue/latence — совместный вывод SYS+NET |
| SYS-06 | Supervision P104–145; SPAN/RSPAN/ERSPAN/RMON P295–303 | NMS/OID/MIB/traps, SNMPv2/v3, три уровня безопасности, push/pull, SNMPB/SNMPC; «MIB Let» требует уточнения |
| SYS-07 | FTP, Messagerie, Impression P147–163; рисунок после P151 | Active/passive, FTPS/SFTP, SMTP/POP3/IMAP, LPD/LPR/IPP/SMB; рисунок FTP прочитан |
| SYS-08 | Active Directory P165–223, таблица 2 | LDAP/Kerberos, идентификаторы, 5 FSMO, доверия, LSDOU, типы/области групп; seizure упомянут, transfer не раскрыт |
| SYS-09 | DevOps P225–250 | Docker/Compose, CI/CD/Git, Ansible inventory/vars/tasks/modules/playbooks/roles/ad hoc/config; практического синтаксиса почти нет |
| SYS-10 | VMWare P252–283; HA/VAAI P285–294; Namespaces P306–307; Scalabilité P308–311 | ESXi/vCenter/vSphere/VMRC/vMotion/vSAN, VMkernel, путь VM, DRS/FT/HA/VAAI; namespaces — один абзац, Kubernetes — только упоминание |
| SYS-11 | Ports et Commandes à savoir P313–344 | Порты представлены списком абзацев, не таблицей. Разобраны netsh/netstat/nslookup; ipconfig, ip a, ping только перечислены |
| NET-01 | Modèle OSI P11–80, таблицы 1–3 | 7 уровней/PDU/оборудование, LLC/MAC, TCP/UDP, handshake/закрытие; encapsulation P83 |
| NET-02 | Notions essentiels P82–105; domaines P136–138 | Кадр/MTU, bandwidth/débit/latence/gigue, hub/switch/router, два режима коммутации, скорости/иерархия; условия размеров требуют уточнения |
| NET-03 | VLAN P107–126 | Типы VLAN, trunk/802.1Q/приоритет, router-on-a-stick/SVI; access-порт отдельно не определён; QoS не возникает автоматически |
| NET-04 | DHCP, DNS P127–135 | DORA/relay, разрешение имён и структура FQDN; ошибку о 13 roots исправлять |
| NET-05 | STP, EtherChannel, FHRP P141–161 | BID/BPDU/root/path/ports; PVST+/MSTP/RSTP лишь перечислены. HSRP разобран кратко, GLBP/VRRP упомянуты |
| NET-06 | Routage P162–179 | Connected/static/default, RIP/OSPF, Hello/LSA/LSDB/SPF/cost/DR/BDR, routing/routed, distance administrative; ABR/ASBR требует исправления, VLSM/BGP вне корпуса |
| NET-07 | Les différents médias P180–233, таблицы 4–5; broadcast P248–249 | Cuivre/Auto-MDI-X/Wi-Fi/fibre, IPv4 классы, IPv6 категории; классы — исторический подход; корректировать directed broadcast |
| NET-08 | Topologie Réseaux P237 и рисунок; CDP/LLDP P244–247; QoS P251–257 | Étoile/anneau/bus/maillée, découverte соседей, FIFO/WFQ/CBWFQ/LLQ; рисунок прочитан |
| SEC-01 | Cisco ACL P13–17; Wildcard Mask P47–53 | Standard/extended, named/numbered, IP/protocol/ports, ACE, IN/OUT, stateless; first-match/implicit deny не раскрыты и требуют предварительного объяснения |
| SEC-02 | NAT/PAT P54–79 | Static/dynamic/PAT, local/global, intranet/DMZ/extranet, SNAT/DNAT, stateful/stateless; ограничения формулировок зафиксированы |
| SEC-03 | Proxy SOCKS, RADIUS, Proxy, Pare-feu, Antivirus, IDS/IPS, PKI P80–105 | AAA/802.1X, proxy/reverse/transparent, методы антивируса, IDS/IPS, CA; forward proxy описан без такого названия |
| SEC-04 | Vocabulaires P20–46; NIS/CERT/CSIRT/SOC/MITRE/CVE/TI/TH P106–139 | PSSI/PRA/PCA/charte/résilience/gouvernance/menace/risque/vulnérabilité/malware; NIS2 — обзор, актуальные юридические требования не выводятся; рисунок SOC/CERT/CSIRT прочитан |
| SEC-05 | Cryptographie P141–173 | Hash/HMAC, симметричное/асимметричное шифрование, DH, ключи, сертификаты/подпись/TLS; существенные неточности требуют исправления |
| SEC-06 | VPN P175–215 и рисунок после P201 | GRE/PPTP/L2TP/TLS/IPsec, AH/ESP, PSK/RSA/SA/IKE/ISAKMP, tunnel/transport, аутентификация; фазы относятся к IKEv1; рисунок RSA — ограниченная схема |
| SEC-07 | Les différents types d’attaques P217–250 | Payload, DHCP/ARP/IP/MAC/DNS spoofing/starvation, snooping/DAI/port security/DNSSEC, атаки AD, XSS/SQLi/CSRF; механизмы описаны кратко, практического взлома нет |
| SEC-08 | Analyse de risque P252–300 | Biens supports/valeurs métier/SR/OV, пары SR/OV, motivation/ressources/activité, gravité/vraisemblance, сценарии/обработка/участие бизнеса; источник риска и обещание соответствия требуют уточнения |

Дополнительные подтемы сохранены внутри соответствующих блоков: IaC (SYS-09), ограничения гипервизорного backup (SYS-03), антирусные методы обнаружения (SEC-03), варианты одно-/двусторонней аутентификации (SEC-06), IOC и уровни threat intelligence (SEC-04). Они не создают расширенную программу.
