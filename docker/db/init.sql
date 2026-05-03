--
-- PostgreSQL database dump
--

\restrict 7jJN1ltpIWBvLfAsQgyJgz5Hg8ebctaldHYeUu4ReoiBvDxQOxnM86e1lJk1uZQ

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: admin_actions_action_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.admin_actions_action_type_enum AS ENUM (
    'delete',
    'pardon',
    'suspend'
);


--
-- Name: admin_actions_target_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.admin_actions_target_type_enum AS ENUM (
    'review',
    'service'
);


--
-- Name: documents_doc_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.documents_doc_type_enum AS ENUM (
    'id_card',
    'diploma',
    'certificate',
    'other'
);


--
-- Name: email_tokens_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.email_tokens_type_enum AS ENUM (
    'verification',
    'password_reset'
);


--
-- Name: prestataire_profiles_application_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.prestataire_profiles_application_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: reports_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reports_status_enum AS ENUM (
    'unseen',
    'seen'
);


--
-- Name: service_requests_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.service_requests_status_enum AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'in_progress',
    'done',
    'cancelled'
);


--
-- Name: services_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.services_status_enum AS ENUM (
    'active',
    'paused',
    'suspended'
);


--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_role_enum AS ENUM (
    'client',
    'prestataire',
    'admin'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_actions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    admin_id uuid NOT NULL,
    action_type public.admin_actions_action_type_enum DEFAULT 'delete'::public.admin_actions_action_type_enum NOT NULL,
    target_id uuid,
    target_type public.admin_actions_target_type_enum,
    target_user_id uuid NOT NULL,
    reason text NOT NULL,
    pardon_amount smallint,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    status boolean DEFAULT true NOT NULL,
    deleted_at timestamp without time zone
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    prestataire_id uuid NOT NULL,
    doc_url character varying NOT NULL,
    doc_type public.documents_doc_type_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: email_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token character varying NOT NULL,
    type public.email_tokens_type_enum NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL
);


--
-- Name: prestataire_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prestataire_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    application_status public.prestataire_profiles_application_status_enum DEFAULT 'pending'::public.prestataire_profiles_application_status_enum NOT NULL,
    doc_validation boolean DEFAULT false NOT NULL,
    title character varying,
    bio text,
    reapplication_count smallint DEFAULT '0'::smallint NOT NULL,
    rejected_at timestamp without time zone,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    reporter_id uuid NOT NULL,
    service_id uuid,
    review_id uuid,
    comment text NOT NULL,
    status public.reports_status_enum DEFAULT 'unseen'::public.reports_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_request_id uuid NOT NULL,
    client_id uuid NOT NULL,
    score smallint NOT NULL,
    commentaire text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    CONSTRAINT "CHK_812f617ad123e7e4c0936b6770" CHECK (((score >= 1) AND (score <= 5)))
);


--
-- Name: service_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_id uuid NOT NULL,
    client_id uuid NOT NULL,
    prestataire_id uuid NOT NULL,
    status public.service_requests_status_enum DEFAULT 'pending'::public.service_requests_status_enum NOT NULL,
    client_message text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    prestataire_id uuid NOT NULL,
    sous_category_id uuid,
    title character varying NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    image_url character varying,
    status public.services_status_enum DEFAULT 'active'::public.services_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- Name: sous_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sous_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    category_id uuid NOT NULL,
    name character varying NOT NULL,
    status boolean DEFAULT true NOT NULL,
    deleted_at timestamp without time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    phone_number character varying,
    date_of_birth date,
    address character varying,
    image_url character varying,
    role public.users_role_enum DEFAULT 'client'::public.users_role_enum NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_suspended boolean DEFAULT false NOT NULL,
    is_email_verified boolean DEFAULT false NOT NULL,
    deleted_review_count smallint DEFAULT '0'::smallint NOT NULL,
    deleted_service_count smallint DEFAULT '0'::smallint NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- Data for Name: admin_actions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_actions (id, admin_id, action_type, target_id, target_type, target_user_id, reason, pardon_amount, created_at) FROM stdin;
ade84a61-0b61-4c4b-83cd-8123ca9c1b0f	0f1406d2-c86c-482a-8efb-778eb7fcfaae	pardon	a0d9b79d-9691-4d1c-98e7-0ca327ec11f5	review	ae82f356-be11-4a90-99a3-b678723513b3	Seeded admin audit entry for reviewed report.	1	2026-05-03 22:36:23.070639
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, status, deleted_at) FROM stdin;
ef6c8fa1-fe75-4fca-ab25-dd9a3d0ba2a6	Electrical	t	\N
f9edd2c1-2c1f-4588-83bb-a94115e4a807	Plumbing	t	\N
b7b0988f-4ad8-4a45-8beb-6e3b81583f9b	Cleaning	t	\N
dec01f6d-d01a-4062-9553-7f9a178f483a	HVAC	t	\N
cce4a457-146e-42ab-bf85-fcaf35c2c8fd	Appliance Repair	t	\N
f67699ac-3a39-4d5d-a3a3-833a600e7abd	Painting and Renovation	t	\N
823441fc-8c18-4741-806c-7047fe299b5f	Gardening	t	\N
2ca37528-5822-4dbc-9e56-c50e333f0106	Moving	t	\N
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, prestataire_id, doc_url, doc_type, created_at) FROM stdin;
128f2b80-3c70-462a-b7d3-2330b0c2673a	3d8de963-091f-4d97-8f8a-8323a5a9f223	seed-documents/provider.tunis.sney3i.tn.pdf	certificate	2026-05-03 22:36:22.979803
dba6211b-f4e2-4d94-a81a-cf1f581fec84	2facc87c-e05c-41e2-a1e4-515ddcacb528	seed-documents/provider.ariana.sney3i.tn.pdf	diploma	2026-05-03 22:36:22.979803
ee601c3a-1cd5-40de-9e30-1d3c96e282c2	60dfacb1-46b8-48e6-8e28-356e8f220fd7	seed-documents/provider.ben.arous.sney3i.tn.pdf	certificate	2026-05-03 22:36:22.979803
e67a7002-3d5f-4b9a-be93-228fcd42581e	1528cc59-dff6-4c42-a0d6-083671713fe3	seed-documents/provider.manouba.sney3i.tn.pdf	diploma	2026-05-03 22:36:22.979803
ee802d27-a513-4104-bc7b-71782dff1232	87b5229a-4bbf-4670-a01e-604f9da202a6	seed-documents/provider.nabeul.sney3i.tn.pdf	certificate	2026-05-03 22:36:22.979803
83e3ffa1-3e02-4b91-9355-4184cc189147	24874b5f-878d-445a-ae53-9d6025b5680f	seed-documents/provider.zaghouan.sney3i.tn.pdf	diploma	2026-05-03 22:36:22.979803
4abab9d9-96a1-4227-890f-de48626db797	58420930-54b2-4ae6-b8ff-47df02599467	seed-documents/provider.bizerte.sney3i.tn.pdf	certificate	2026-05-03 22:36:22.979803
ca08e608-f065-42b2-9de0-6cc409181aac	433048ab-a961-4bc7-8943-eee063ae916a	seed-documents/provider.beja.sney3i.tn.pdf	diploma	2026-05-03 22:36:22.979803
67595269-21f8-4b29-937c-3f95e7f6221b	539bac60-6760-41d9-bf71-2a618743d3fc	seed-documents/provider.jendouba.sney3i.tn.pdf	certificate	2026-05-03 22:36:22.979803
8cc38d68-a6b7-402a-9e5e-eb4435ce7e95	cd3b32bf-05f8-4fca-ba2d-35121c0ee3c6	seed-documents/provider.kef.sney3i.tn.pdf	diploma	2026-05-03 22:36:22.979803
62f5ec36-58f4-4a1d-8d2a-267f99fb2105	40533c1b-9bcd-4b88-a591-4b1d6605604c	seed-documents/provider.siliana.sney3i.tn.pdf	certificate	2026-05-03 22:36:22.979803
04c97ea6-fd41-44ba-b253-ce51dcd855ba	e02adaf0-ad42-4cbc-8fa1-8fd0cde29bba	seed-documents/provider.sousse.sney3i.tn.pdf	diploma	2026-05-03 22:36:22.979803
093bd161-bb33-43cc-a05b-2c332daa3be2	fcd55b97-0e32-4eb9-8e91-cbc6a18c42ce	seed-documents/provider.monastir.sney3i.tn.pdf	certificate	2026-05-03 22:36:22.979803
bd39a53f-2880-4ece-80e4-57e27a9b954e	a9affbca-8d7e-46fc-84c3-d6f5907689de	seed-documents/provider.mahdia.sney3i.tn.pdf	diploma	2026-05-03 22:36:22.979803
c4a7c63f-731d-4ea6-8038-5a6c7782be9a	deb7e2ed-aca0-49f0-8721-562d95649f9a	seed-documents/provider.sfax.sney3i.tn.pdf	certificate	2026-05-03 22:36:22.979803
c11eac1a-3950-4f13-b7c5-3f653ac78921	b6d9038b-be6d-4a27-91ec-ae2c9acfb6af	seed-documents/provider.kairouan.sney3i.tn.pdf	diploma	2026-05-03 22:36:22.979803
bb16c2f4-110f-4989-b5ad-3417e367b0ca	8ec5bb9b-3946-4eb0-a405-1eaba5786cc6	seed-documents/provider.kasserine.sney3i.tn.pdf	certificate	2026-05-03 22:36:22.979803
56857ee4-98f7-4d91-9975-a5e5c729423d	88b1421b-66a0-428c-9d25-22a2c926cb8a	seed-documents/provider.sidi.bouzid.sney3i.tn.pdf	diploma	2026-05-03 22:36:22.979803
19646c87-c004-4ac0-a014-006f3d58c0e6	3b852976-4604-43e9-92a6-4849e04240f0	seed-documents/provider.gabes.sney3i.tn.pdf	certificate	2026-05-03 22:36:22.979803
5a2f3451-fa50-42ee-9d38-91cb00a0d1f2	fc934708-a782-4a37-9d8a-679694e8d330	seed-documents/provider.medenine.sney3i.tn.pdf	diploma	2026-05-03 22:36:22.979803
5a1deb10-ad12-48b1-a4dd-a958ad5110a4	8257ca94-3f92-4df5-964e-24bbce086ce5	seed-documents/provider.tataouine.sney3i.tn.pdf	certificate	2026-05-03 22:36:22.979803
d3b1f5ae-8ae8-4560-a40f-0903a0b05f8a	de02e2b0-a179-4274-8c09-d7d5585a3f11	seed-documents/provider.gafsa.sney3i.tn.pdf	diploma	2026-05-03 22:36:22.979803
fd1db6c7-38dc-4579-8577-101c12dc7818	ee49c626-86c1-4480-8ea5-29c1b616c1a5	seed-documents/provider.tozeur.sney3i.tn.pdf	certificate	2026-05-03 22:36:22.979803
50040162-eb66-4638-ad6d-b206ad005c22	35e2d806-cfe8-495c-88c2-35704af196aa	seed-documents/provider.kebili.sney3i.tn.pdf	diploma	2026-05-03 22:36:22.979803
\.


--
-- Data for Name: email_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_tokens (id, user_id, token, type, expires_at, used) FROM stdin;
\.


--
-- Data for Name: prestataire_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prestataire_profiles (id, user_id, application_status, doc_validation, title, bio, reapplication_count, rejected_at, rejection_reason, created_at, updated_at) FROM stdin;
152b8203-67c5-4be3-b584-9a677558e294	3d8de963-091f-4d97-8f8a-8323a5a9f223	approved	t	Licensed Electrician	Licensed Electrician serving Tunis and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
a5e786d8-5539-4b3c-bca2-84ec00ef420c	2facc87c-e05c-41e2-a1e4-515ddcacb528	approved	t	Plumbing Technician	Plumbing Technician serving Ariana and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
7e1bb2aa-1ae0-4f31-a505-b2ebfc481bdf	60dfacb1-46b8-48e6-8e28-356e8f220fd7	approved	t	Deep Cleaning Specialist	Deep Cleaning Specialist serving Ben Arous and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
0978a635-9720-4201-9e88-5b67f9b9a5b0	1528cc59-dff6-4c42-a0d6-083671713fe3	approved	t	HVAC Technician	HVAC Technician serving Manouba and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
574a9e11-18b7-4ca1-8981-6e0838961697	87b5229a-4bbf-4670-a01e-604f9da202a6	approved	t	Appliance Repair Specialist	Appliance Repair Specialist serving Nabeul and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
7119a410-8559-45d7-aebe-5bc976b4188f	24874b5f-878d-445a-ae53-9d6025b5680f	approved	t	Interior Painter	Interior Painter serving Zaghouan and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
51545c19-febe-42e2-b37c-1c5cb5dc1a5d	58420930-54b2-4ae6-b8ff-47df02599467	approved	t	Garden Maintenance Expert	Garden Maintenance Expert serving Bizerte and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
ffda77bd-d3f6-4339-9ccc-8e566f417c69	433048ab-a961-4bc7-8943-eee063ae916a	approved	t	Moving and Assembly Pro	Moving and Assembly Pro serving Beja and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
37812a56-712b-417f-a119-398c0053f6c3	539bac60-6760-41d9-bf71-2a618743d3fc	approved	t	Licensed Electrician	Licensed Electrician serving Jendouba and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
e5ce1297-1c59-429d-94a6-9f51ac7629ba	cd3b32bf-05f8-4fca-ba2d-35121c0ee3c6	approved	t	Plumbing Technician	Plumbing Technician serving Kef and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
41057690-51dc-4ded-89c1-8600005432d7	40533c1b-9bcd-4b88-a591-4b1d6605604c	approved	t	Deep Cleaning Specialist	Deep Cleaning Specialist serving Siliana and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
615e2da4-69dd-4c5f-b92c-7d4d1df90033	e02adaf0-ad42-4cbc-8fa1-8fd0cde29bba	approved	t	HVAC Technician	HVAC Technician serving Sousse and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
18b6992a-fb78-438a-a556-0fcf5c98f6c8	fcd55b97-0e32-4eb9-8e91-cbc6a18c42ce	approved	t	Appliance Repair Specialist	Appliance Repair Specialist serving Monastir and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
631c1eea-857e-45f1-907d-c88ab59c08c4	a9affbca-8d7e-46fc-84c3-d6f5907689de	approved	t	Interior Painter	Interior Painter serving Mahdia and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
5026349c-2da2-49c7-9eeb-71a560f55f16	deb7e2ed-aca0-49f0-8721-562d95649f9a	approved	t	Garden Maintenance Expert	Garden Maintenance Expert serving Sfax and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
11b14d17-def5-49a2-b1c9-6ee94104ff78	b6d9038b-be6d-4a27-91ec-ae2c9acfb6af	approved	t	Moving and Assembly Pro	Moving and Assembly Pro serving Kairouan and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
43fe8a74-877d-4dc9-9b7e-11448cf789a3	8ec5bb9b-3946-4eb0-a405-1eaba5786cc6	approved	t	Licensed Electrician	Licensed Electrician serving Kasserine and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
ae85f6c0-0f24-428b-8fd3-9cba81d69d3a	88b1421b-66a0-428c-9d25-22a2c926cb8a	approved	t	Plumbing Technician	Plumbing Technician serving Sidi Bouzid and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
41f9e740-e25b-4bef-b29c-d03e11b5848a	3b852976-4604-43e9-92a6-4849e04240f0	approved	t	Deep Cleaning Specialist	Deep Cleaning Specialist serving Gabes and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
22028d34-c1a0-4d18-88fb-3e33a4c64711	fc934708-a782-4a37-9d8a-679694e8d330	approved	t	HVAC Technician	HVAC Technician serving Medenine and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
4d62821c-1051-4861-a875-e32dc5d6af16	8257ca94-3f92-4df5-964e-24bbce086ce5	approved	t	Appliance Repair Specialist	Appliance Repair Specialist serving Tataouine and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
82f46fd5-6060-4649-90e3-6c929e42f8eb	de02e2b0-a179-4274-8c09-d7d5585a3f11	approved	t	Interior Painter	Interior Painter serving Gafsa and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
8cd179b1-146e-4097-a739-b1b7e065ca19	ee49c626-86c1-4480-8ea5-29c1b616c1a5	approved	t	Garden Maintenance Expert	Garden Maintenance Expert serving Tozeur and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
1055398b-663c-4226-8317-58ee4d9439df	35e2d806-cfe8-495c-88c2-35704af196aa	approved	t	Moving and Assembly Pro	Moving and Assembly Pro serving Kebili and nearby communities with clear pricing and reliable scheduling.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
22b98c4b-2898-403b-aeac-7eae8030b34b	3e151166-18fe-4030-8f9f-a2392a604645	pending	f	Deep Cleaning Specialist	New applicant based in Tunis, Tunisia. Documents are ready for admin review.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
66c3d1a8-31e9-48ac-93d1-491687999e87	e6b095d5-e205-4c1c-b5f8-c00ee935ccc4	pending	f	HVAC Technician	New applicant based in Sfax, Tunisia. Documents are ready for admin review.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
1fb3d28b-69c9-491f-aaa3-8d928be8e846	1256de4b-faf3-45c9-a4b7-4cb741c380c4	pending	f	Appliance Repair Specialist	New applicant based in Sousse, Tunisia. Documents are ready for admin review.	0	\N	\N	2026-05-03 22:36:22.960499	2026-05-03 22:36:22.960499
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reports (id, reporter_id, service_id, review_id, comment, status, created_at, updated_at) FROM stdin;
dfa86ce5-aebe-4260-9383-a7893b112f9e	47a4549a-0cb0-4d86-aa70-64979bd61011	40362169-e3fb-4ccd-87d7-2e71d8023d79	\N	Service description needs admin review for clarity.	unseen	2026-05-03 22:36:23.061524	2026-05-03 22:36:23.061524
b07b87fc-1d4f-4d37-acc5-5202272084cc	0a6c563b-a8a0-41cc-9fcb-593026c9f3bd	eff33698-732c-459d-b942-b7b1ec319104	\N	Client reported a scheduling mismatch.	unseen	2026-05-03 22:36:23.061524	2026-05-03 22:36:23.061524
8fe081b0-38e9-453b-95bf-6525a6500f67	ae82f356-be11-4a90-99a3-b678723513b3	\N	a0d9b79d-9691-4d1c-98e7-0ca327ec11f5	Review was checked and no action was needed.	seen	2026-05-03 22:36:23.061524	2026-05-03 22:36:23.061524
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, service_request_id, client_id, score, commentaire, created_at, deleted_at) FROM stdin;
a0d9b79d-9691-4d1c-98e7-0ca327ec11f5	bd20d12f-3fae-4a0b-a024-77415dee70c6	3a1a2dbd-79ec-49f7-9880-95eb4ae8d9dd	5	Excellent service, punctual and very professional.	2026-05-03 22:36:23.052769	\N
28fff808-c622-468a-bdaa-296f774ee242	5fb61624-26f7-473d-95df-3b03690e8d63	9a7b1871-4df1-4d3e-8ae0-2fb4cf8f1b22	4	Good work and clear communication throughout the visit.	2026-05-03 22:36:23.052769	\N
e54d6ac7-09e3-46ad-8759-4a8579df105d	a5f3b9d1-f560-4257-a0e5-f84a7215be78	0a6c563b-a8a0-41cc-9fcb-593026c9f3bd	5	Excellent service, punctual and very professional.	2026-05-03 22:36:23.052769	\N
\.


--
-- Data for Name: service_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_requests (id, service_id, client_id, prestataire_id, status, client_message, created_at, updated_at) FROM stdin;
1fcddc9c-1b6c-485d-a100-837fcdf0d37e	9d024440-4dcc-4170-9f22-8450d4d42204	47a4549a-0cb0-4d86-aa70-64979bd61011	3d8de963-091f-4d97-8f8a-8323a5a9f223	pending	Hello, I need help with "Licensed Electrician in Tunis" at my home in Tunis, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
6c161dbe-4245-4a15-bc5b-af453003d030	2166471c-8754-4873-99c7-3e91d968ea1e	3f1b5af0-2bed-44de-b608-f9459b6cf91a	2facc87c-e05c-41e2-a1e4-515ddcacb528	accepted	Hello, I need help with "Plumbing Technician in Ariana" at my home in Zaghouan, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
f9de7b1c-a0b6-475d-a301-5f1948607992	fbd5f1b1-9f51-4e72-94d6-75caef670140	51832dcc-2eba-49b9-b389-063a1d14ce5b	60dfacb1-46b8-48e6-8e28-356e8f220fd7	in_progress	Hello, I need help with "Deep Cleaning Specialist in Ben Arous" at my home in Siliana, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
bd20d12f-3fae-4a0b-a024-77415dee70c6	fd04a40f-1ea3-45fd-81f8-c2ab05e674d1	3a1a2dbd-79ec-49f7-9880-95eb4ae8d9dd	1528cc59-dff6-4c42-a0d6-083671713fe3	done	Hello, I need help with "HVAC Technician in Manouba" at my home in Kairouan, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
e13c9e56-e9c7-4071-ba3b-d134a0a64a96	b5335059-61de-4520-9c9c-4eab7d06a598	ebda443c-60eb-49cf-9214-82cd822d9b25	87b5229a-4bbf-4670-a01e-604f9da202a6	rejected	Hello, I need help with "Appliance Repair Specialist in Nabeul" at my home in Tataouine, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
e2bb0305-c73e-4d99-a5d4-8c5ace83c980	40362169-e3fb-4ccd-87d7-2e71d8023d79	7c99232a-a279-4f7b-bd3f-772c773ab552	24874b5f-878d-445a-ae53-9d6025b5680f	cancelled	Hello, I need help with "Interior Painter in Zaghouan" at my home in Ariana, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
ca3514a8-6592-4fdd-a78b-09336088874e	45a44de9-5c6b-4de9-994b-b624c46f3d78	ae82f356-be11-4a90-99a3-b678723513b3	58420930-54b2-4ae6-b8ff-47df02599467	pending	Hello, I need help with "Garden Maintenance Expert in Bizerte" at my home in Bizerte, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
5f917b46-09ec-46cc-b675-d35bf5dff91d	d069c1b2-cbd8-4346-8ff1-8a7bdd7dc589	f2bcad2f-e511-4466-866f-1cfb6662393a	433048ab-a961-4bc7-8943-eee063ae916a	accepted	Hello, I need help with "Moving and Assembly Pro in Beja" at my home in Sousse, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
50ef512f-b4c0-4b49-a38f-0a9dd1007f09	127731c1-5461-4334-8d44-a37b56dde496	d998107c-399b-420f-b8c3-698cec5bed4f	539bac60-6760-41d9-bf71-2a618743d3fc	in_progress	Hello, I need help with "Licensed Electrician in Jendouba" at my home in Kasserine, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
5fb61624-26f7-473d-95df-3b03690e8d63	ba8e9a48-f55e-41a8-b7bc-7df265d681d7	9a7b1871-4df1-4d3e-8ae0-2fb4cf8f1b22	cd3b32bf-05f8-4fca-ba2d-35121c0ee3c6	done	Hello, I need help with "Plumbing Technician in Kef" at my home in Gafsa, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
a8826b9e-3460-41d9-97e8-9bbbcb6d06cb	ad798b07-2afd-4a3a-81ac-4ca51380a443	3edc0883-e1b4-4a08-92b1-c5bdab5e6ea7	40533c1b-9bcd-4b88-a591-4b1d6605604c	rejected	Hello, I need help with "Deep Cleaning Specialist in Siliana" at my home in Ben Arous, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
afcb508e-63bc-4c89-9b19-6d2b96520568	cac34297-bf32-4bae-9c72-035876d7be71	1e724c47-2db2-4fd9-928b-8f3db280449d	e02adaf0-ad42-4cbc-8fa1-8fd0cde29bba	cancelled	Hello, I need help with "HVAC Technician in Sousse" at my home in Beja, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
bbc1ac2d-7dfd-4814-a7e6-2413cfb3dd60	eff33698-732c-459d-b942-b7b1ec319104	7011bf80-62a6-4043-bb1d-c39040d0d100	fcd55b97-0e32-4eb9-8e91-cbc6a18c42ce	pending	Hello, I need help with "Appliance Repair Specialist in Monastir" at my home in Monastir, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
49bb878b-43d7-4844-8489-b1a14b59e308	c464bbc8-f346-4290-b819-72ff897fec12	8213f13c-58e8-4a0c-b455-707603be7160	a9affbca-8d7e-46fc-84c3-d6f5907689de	accepted	Hello, I need help with "Interior Painter in Mahdia" at my home in Sidi Bouzid, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
0ebcc97f-18d0-4483-9031-2e8948c23009	a74f0814-b945-48ea-97d1-23629ae0fc40	da91d721-2d3d-4a8c-aebd-7e2395ab3b12	deb7e2ed-aca0-49f0-8721-562d95649f9a	in_progress	Hello, I need help with "Garden Maintenance Expert in Sfax" at my home in Tozeur, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
a5f3b9d1-f560-4257-a0e5-f84a7215be78	4380dfa9-36d1-4941-9cd0-e63df69a0e07	0a6c563b-a8a0-41cc-9fcb-593026c9f3bd	b6d9038b-be6d-4a27-91ec-ae2c9acfb6af	done	Hello, I need help with "Moving and Assembly Pro in Kairouan" at my home in Manouba, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
23799637-cc7c-43a4-8aa1-0ada1afc3745	bd34c83e-fd0a-4b56-8bd7-645bbdc58a43	aca836ec-3798-44e9-8dee-f4656cd77d54	8ec5bb9b-3946-4eb0-a405-1eaba5786cc6	rejected	Hello, I need help with "Licensed Electrician in Kasserine" at my home in Jendouba, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
295f1037-24a1-42f2-95e8-4af3a94bacc7	95a1ad83-b771-4e5d-9d61-1ecd774201a8	3ae21e8a-1854-4b9f-b4fa-f82bada93956	88b1421b-66a0-428c-9d25-22a2c926cb8a	cancelled	Hello, I need help with "Plumbing Technician in Sidi Bouzid" at my home in Mahdia, Tunisia.	2026-05-03 22:36:23.038373	2026-05-03 22:36:23.038373
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, prestataire_id, sous_category_id, title, description, price, image_url, status, created_at, updated_at, deleted_at) FROM stdin;
9d024440-4dcc-4170-9f22-8450d4d42204	3d8de963-091f-4d97-8f8a-8323a5a9f223	61888644-b8c3-40bf-8976-7f313a3ebc3d	Licensed Electrician in Tunis	Professional wiring installation service for homes and small businesses in Tunis. Includes diagnosis, labor, and transparent follow-up.	160.00	https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
2166471c-8754-4873-99c7-3e91d968ea1e	2facc87c-e05c-41e2-a1e4-515ddcacb528	4093e3c5-7aa0-453a-bb4f-bd5eb0d5ec90	Plumbing Technician in Ariana	Professional drain unclogging service for homes and small businesses in Ariana. Includes diagnosis, labor, and transparent follow-up.	145.00	https://images.unsplash.com/photo-1607400201515-c2c41c07d307?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
fbd5f1b1-9f51-4e72-94d6-75caef670140	60dfacb1-46b8-48e6-8e28-356e8f220fd7	ac1807cd-b062-460b-a26a-24059816780a	Deep Cleaning Specialist in Ben Arous	Professional home deep cleaning service for homes and small businesses in Ben Arous. Includes diagnosis, labor, and transparent follow-up.	125.00	https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
fd04a40f-1ea3-45fd-81f8-c2ab05e674d1	1528cc59-dff6-4c42-a0d6-083671713fe3	4323372d-ca50-40a0-bd2c-05bb15c94e27	HVAC Technician in Manouba	Professional ac maintenance service for homes and small businesses in Manouba. Includes diagnosis, labor, and transparent follow-up.	235.00	https://images.unsplash.com/photo-1581092160607-ee22731c06d3?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
b5335059-61de-4520-9c9c-4eab7d06a598	87b5229a-4bbf-4670-a01e-604f9da202a6	7c8fd811-5360-445b-8a8f-d09972f9c22b	Appliance Repair Specialist in Nabeul	Professional washing machine repair service for homes and small businesses in Nabeul. Includes diagnosis, labor, and transparent follow-up.	180.00	https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
40362169-e3fb-4ccd-87d7-2e71d8023d79	24874b5f-878d-445a-ae53-9d6025b5680f	d38dfc25-bdaf-43e9-b6cd-0a7998c57370	Interior Painter in Zaghouan	Professional tile repair service for homes and small businesses in Zaghouan. Includes diagnosis, labor, and transparent follow-up.	210.00	https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
45a44de9-5c6b-4de9-994b-b624c46f3d78	58420930-54b2-4ae6-b8ff-47df02599467	35e11fb1-990e-408c-9423-c618382e57a1	Garden Maintenance Expert in Bizerte	Professional garden maintenance service for homes and small businesses in Bizerte. Includes diagnosis, labor, and transparent follow-up.	100.00	https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
d069c1b2-cbd8-4346-8ff1-8a7bdd7dc589	433048ab-a961-4bc7-8943-eee063ae916a	36ce2176-2ff6-46a9-a454-bf6561f9dbd0	Moving and Assembly Pro in Beja	Professional furniture assembly service for homes and small businesses in Beja. Includes diagnosis, labor, and transparent follow-up.	210.00	https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
127731c1-5461-4334-8d44-a37b56dde496	539bac60-6760-41d9-bf71-2a618743d3fc	61888644-b8c3-40bf-8976-7f313a3ebc3d	Licensed Electrician in Jendouba	Professional wiring installation service for homes and small businesses in Jendouba. Includes diagnosis, labor, and transparent follow-up.	205.00	https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
ba8e9a48-f55e-41a8-b7bc-7df265d681d7	cd3b32bf-05f8-4fca-ba2d-35121c0ee3c6	4093e3c5-7aa0-453a-bb4f-bd5eb0d5ec90	Plumbing Technician in Kef	Professional drain unclogging service for homes and small businesses in Kef. Includes diagnosis, labor, and transparent follow-up.	190.00	https://images.unsplash.com/photo-1607400201515-c2c41c07d307?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
ad798b07-2afd-4a3a-81ac-4ca51380a443	40533c1b-9bcd-4b88-a591-4b1d6605604c	ac1807cd-b062-460b-a26a-24059816780a	Deep Cleaning Specialist in Siliana	Professional home deep cleaning service for homes and small businesses in Siliana. Includes diagnosis, labor, and transparent follow-up.	95.00	https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
cac34297-bf32-4bae-9c72-035876d7be71	e02adaf0-ad42-4cbc-8fa1-8fd0cde29bba	4323372d-ca50-40a0-bd2c-05bb15c94e27	HVAC Technician in Sousse	Professional ac maintenance service for homes and small businesses in Sousse. Includes diagnosis, labor, and transparent follow-up.	205.00	https://images.unsplash.com/photo-1581092160607-ee22731c06d3?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
eff33698-732c-459d-b942-b7b1ec319104	fcd55b97-0e32-4eb9-8e91-cbc6a18c42ce	7c8fd811-5360-445b-8a8f-d09972f9c22b	Appliance Repair Specialist in Monastir	Professional washing machine repair service for homes and small businesses in Monastir. Includes diagnosis, labor, and transparent follow-up.	150.00	https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
c464bbc8-f346-4290-b819-72ff897fec12	a9affbca-8d7e-46fc-84c3-d6f5907689de	d38dfc25-bdaf-43e9-b6cd-0a7998c57370	Interior Painter in Mahdia	Professional tile repair service for homes and small businesses in Mahdia. Includes diagnosis, labor, and transparent follow-up.	255.00	https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
a74f0814-b945-48ea-97d1-23629ae0fc40	deb7e2ed-aca0-49f0-8721-562d95649f9a	35e11fb1-990e-408c-9423-c618382e57a1	Garden Maintenance Expert in Sfax	Professional garden maintenance service for homes and small businesses in Sfax. Includes diagnosis, labor, and transparent follow-up.	145.00	https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
4380dfa9-36d1-4941-9cd0-e63df69a0e07	b6d9038b-be6d-4a27-91ec-ae2c9acfb6af	36ce2176-2ff6-46a9-a454-bf6561f9dbd0	Moving and Assembly Pro in Kairouan	Professional furniture assembly service for homes and small businesses in Kairouan. Includes diagnosis, labor, and transparent follow-up.	180.00	https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
bd34c83e-fd0a-4b56-8bd7-645bbdc58a43	8ec5bb9b-3946-4eb0-a405-1eaba5786cc6	61888644-b8c3-40bf-8976-7f313a3ebc3d	Licensed Electrician in Kasserine	Professional wiring installation service for homes and small businesses in Kasserine. Includes diagnosis, labor, and transparent follow-up.	175.00	https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
95a1ad83-b771-4e5d-9d61-1ecd774201a8	88b1421b-66a0-428c-9d25-22a2c926cb8a	4093e3c5-7aa0-453a-bb4f-bd5eb0d5ec90	Plumbing Technician in Sidi Bouzid	Professional drain unclogging service for homes and small businesses in Sidi Bouzid. Includes diagnosis, labor, and transparent follow-up.	160.00	https://images.unsplash.com/photo-1607400201515-c2c41c07d307?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
3dce42bb-0d2d-4f9d-89af-b21370f358e4	3b852976-4604-43e9-92a6-4849e04240f0	ac1807cd-b062-460b-a26a-24059816780a	Deep Cleaning Specialist in Gabes	Professional home deep cleaning service for homes and small businesses in Gabes. Includes diagnosis, labor, and transparent follow-up.	140.00	https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
5cf1634d-e448-47fa-a3c9-1d638059a72f	fc934708-a782-4a37-9d8a-679694e8d330	4323372d-ca50-40a0-bd2c-05bb15c94e27	HVAC Technician in Medenine	Professional ac maintenance service for homes and small businesses in Medenine. Includes diagnosis, labor, and transparent follow-up.	250.00	https://images.unsplash.com/photo-1581092160607-ee22731c06d3?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
7f3728b2-f7db-4d6e-9fff-ada607f6b87d	8257ca94-3f92-4df5-964e-24bbce086ce5	7c8fd811-5360-445b-8a8f-d09972f9c22b	Appliance Repair Specialist in Tataouine	Professional washing machine repair service for homes and small businesses in Tataouine. Includes diagnosis, labor, and transparent follow-up.	120.00	https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
e1612771-753d-49f0-a3d4-6abbee1d5196	de02e2b0-a179-4274-8c09-d7d5585a3f11	d38dfc25-bdaf-43e9-b6cd-0a7998c57370	Interior Painter in Gafsa	Professional tile repair service for homes and small businesses in Gafsa. Includes diagnosis, labor, and transparent follow-up.	225.00	https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
13439ade-d691-46ea-8ff0-1653ebb09a20	ee49c626-86c1-4480-8ea5-29c1b616c1a5	35e11fb1-990e-408c-9423-c618382e57a1	Garden Maintenance Expert in Tozeur	Professional garden maintenance service for homes and small businesses in Tozeur. Includes diagnosis, labor, and transparent follow-up.	115.00	https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
259ea6c9-309a-45ae-95d7-d92cd1d222d3	35e2d806-cfe8-495c-88c2-35704af196aa	36ce2176-2ff6-46a9-a454-bf6561f9dbd0	Moving and Assembly Pro in Kebili	Professional furniture assembly service for homes and small businesses in Kebili. Includes diagnosis, labor, and transparent follow-up.	225.00	https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=900&q=80	active	2026-05-03 22:36:23.018142	2026-05-03 22:36:23.018142	\N
\.


--
-- Data for Name: sous_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sous_categories (id, category_id, name, status, deleted_at) FROM stdin;
61888644-b8c3-40bf-8976-7f313a3ebc3d	ef6c8fa1-fe75-4fca-ab25-dd9a3d0ba2a6	Wiring Installation	t	\N
9e81f0cd-2c03-45b7-98b8-19ab8b8ac09a	ef6c8fa1-fe75-4fca-ab25-dd9a3d0ba2a6	Emergency Electrical Repair	t	\N
e12da475-13cf-4ce3-8977-3b501201493e	f9edd2c1-2c1f-4588-83bb-a94115e4a807	Leak Repair	t	\N
4093e3c5-7aa0-453a-bb4f-bd5eb0d5ec90	f9edd2c1-2c1f-4588-83bb-a94115e4a807	Drain Unclogging	t	\N
ac1807cd-b062-460b-a26a-24059816780a	b7b0988f-4ad8-4a45-8beb-6e3b81583f9b	Home Deep Cleaning	t	\N
422cb53c-4320-422d-85f0-19adc4f0db91	b7b0988f-4ad8-4a45-8beb-6e3b81583f9b	Window Cleaning	t	\N
8987a072-1e56-49b8-bee5-1d23fa86d5be	dec01f6d-d01a-4062-9553-7f9a178f483a	Air Conditioner Installation	t	\N
4323372d-ca50-40a0-bd2c-05bb15c94e27	dec01f6d-d01a-4062-9553-7f9a178f483a	AC Maintenance	t	\N
7c8fd811-5360-445b-8a8f-d09972f9c22b	cce4a457-146e-42ab-bf85-fcaf35c2c8fd	Washing Machine Repair	t	\N
a6d1f687-e4ab-4dd0-984d-e684183602f2	cce4a457-146e-42ab-bf85-fcaf35c2c8fd	Refrigerator Repair	t	\N
ce5a82b7-fb35-4b8d-91e4-5996a6cbb32c	f67699ac-3a39-4d5d-a3a3-833a600e7abd	Interior Painting	t	\N
d38dfc25-bdaf-43e9-b6cd-0a7998c57370	f67699ac-3a39-4d5d-a3a3-833a600e7abd	Tile Repair	t	\N
35e11fb1-990e-408c-9423-c618382e57a1	823441fc-8c18-4741-806c-7047fe299b5f	Garden Maintenance	t	\N
e6ec13c5-ad4c-4c24-a29c-dfb5d28c0839	823441fc-8c18-4741-806c-7047fe299b5f	Tree Trimming	t	\N
296ebb14-7b9b-41dd-9277-2c2061a2f0f0	2ca37528-5822-4dbc-9e56-c50e333f0106	Local Moving	t	\N
36ce2176-2ff6-46a9-a454-bf6561f9dbd0	2ca37528-5822-4dbc-9e56-c50e333f0106	Furniture Assembly	t	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password, phone_number, date_of_birth, address, image_url, role, is_active, is_suspended, is_email_verified, deleted_review_count, deleted_service_count, created_at, updated_at, deleted_at) FROM stdin;
0f1406d2-c86c-482a-8efb-778eb7fcfaae	Platform Admin	admin@sney3i.tn	$2b$10$c7k8isFfBeNY0A18ADtsPOtcIOkx8XmXbhrmVqokKficENFB8KB/6	+21671100000	\N	Tunis, Tunisia	\N	admin	t	f	t	0	0	2026-05-03 22:36:22.861952	2026-05-03 22:36:22.861952	\N
47a4549a-0cb0-4d86-aa70-64979bd61011	Yassine Trabelsi	client.tunis@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100000	1978-01-01	Tunis, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
7c99232a-a279-4f7b-bd3f-772c773ab552	Amira Ben Salem	client.ariana@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100001	1979-02-02	Ariana, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
3edc0883-e1b4-4a08-92b1-c5bdab5e6ea7	Mehdi Jaziri	client.ben.arous@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100002	1980-03-03	Ben Arous, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
0a6c563b-a8a0-41cc-9fcb-593026c9f3bd	Nour Bouazizi	client.manouba@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100003	1981-04-04	Manouba, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
86c1f590-8a57-4a49-922a-3a978adbdc7f	Rania Chouchane	client.nabeul@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100004	1982-05-05	Nabeul, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
3f1b5af0-2bed-44de-b608-f9459b6cf91a	Oussama Mbarek	client.zaghouan@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100005	1983-06-06	Zaghouan, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
ae82f356-be11-4a90-99a3-b678723513b3	Ines Mansouri	client.bizerte@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100006	1984-07-07	Bizerte, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
1e724c47-2db2-4fd9-928b-8f3db280449d	Sami Gharbi	client.beja@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100007	1985-08-08	Beja, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
aca836ec-3798-44e9-8dee-f4656cd77d54	Manel Ferchichi	client.jendouba@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100008	1986-09-09	Jendouba, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
acc2664e-4f75-4372-bfd1-7154941132a7	Walid Haddad	client.kef@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100009	1987-10-10	Kef, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
51832dcc-2eba-49b9-b389-063a1d14ce5b	Leila Dridi	client.siliana@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100010	1988-11-11	Siliana, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
f2bcad2f-e511-4466-866f-1cfb6662393a	Karim Bouhlel	client.sousse@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100011	1989-12-12	Sousse, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
7011bf80-62a6-4043-bb1d-c39040d0d100	Salma Kammoun	client.monastir@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100012	1990-01-13	Monastir, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
3ae21e8a-1854-4b9f-b4fa-f82bada93956	Firas Ayadi	client.mahdia@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100013	1991-02-14	Mahdia, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
4e71113a-c656-49a8-a2cf-35f33d097a39	Mariem Elloumi	client.sfax@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100014	1992-03-15	Sfax, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
3a1a2dbd-79ec-49f7-9880-95eb4ae8d9dd	Hatem Hachicha	client.kairouan@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100015	1993-04-16	Kairouan, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
d998107c-399b-420f-b8c3-698cec5bed4f	Amina Jlassi	client.kasserine@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100016	1994-05-17	Kasserine, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
8213f13c-58e8-4a0c-b455-707603be7160	Anis Oueslati	client.sidi.bouzid@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100017	1995-06-18	Sidi Bouzid, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
fff712d0-a78e-4c27-98c2-3b132a4dd3f5	Lobna Khelifi	client.gabes@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100018	1996-07-19	Gabes, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
decd5b24-d1a7-4da4-88be-5e05ecbc8747	Tarek Hamdi	client.medenine@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100019	1997-08-20	Medenine, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
ebda443c-60eb-49cf-9214-82cd822d9b25	Nesrine Guesmi	client.tataouine@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100020	1998-09-21	Tataouine, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
9a7b1871-4df1-4d3e-8ae0-2fb4cf8f1b22	Mohamed Baccouche	client.gafsa@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100021	1999-10-22	Gafsa, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
da91d721-2d3d-4a8c-aebd-7e2395ab3b12	Aya Mzoughi	client.tozeur@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100022	1978-11-23	Tozeur, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
c0c52e09-05d3-42ab-99e3-81f7bd9512b6	Bilel Saidi	client.kebili@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162100023	1979-12-24	Kebili, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.913092	2026-05-03 22:36:22.913092	\N
3d8de963-091f-4d97-8f8a-8323a5a9f223	Ali Chebbi	provider.tunis@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000000	1985-08-08	Tunis, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
2facc87c-e05c-41e2-a1e4-515ddcacb528	Samira Othmani	provider.ariana@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000001	1986-09-09	Ariana, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
60dfacb1-46b8-48e6-8e28-356e8f220fd7	Nizar Saidi	provider.ben.arous@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000002	1987-10-10	Ben Arous, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
1528cc59-dff6-4c42-a0d6-083671713fe3	Houda Mansour	provider.manouba@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000003	1988-11-11	Manouba, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
87b5229a-4bbf-4670-a01e-604f9da202a6	Foued Karoui	provider.nabeul@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000004	1989-12-12	Nabeul, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
24874b5f-878d-445a-ae53-9d6025b5680f	Rim Dakhli	provider.zaghouan@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000005	1990-01-13	Zaghouan, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
58420930-54b2-4ae6-b8ff-47df02599467	Aymen Guermazi	provider.bizerte@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000006	1991-02-14	Bizerte, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
433048ab-a961-4bc7-8943-eee063ae916a	Sarra Hentati	provider.beja@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000007	1992-03-15	Beja, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
539bac60-6760-41d9-bf71-2a618743d3fc	Moez Hamdi	provider.jendouba@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000008	1993-04-16	Jendouba, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
cd3b32bf-05f8-4fca-ba2d-35121c0ee3c6	Emna Sghaier	provider.kef@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000009	1994-05-17	Kef, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
40533c1b-9bcd-4b88-a591-4b1d6605604c	Lotfi Bousnina	provider.siliana@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000010	1995-06-18	Siliana, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
e02adaf0-ad42-4cbc-8fa1-8fd0cde29bba	Nadia Kallel	provider.sousse@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000011	1996-07-19	Sousse, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
fcd55b97-0e32-4eb9-8e91-cbc6a18c42ce	Taha Rekik	provider.monastir@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000012	1997-08-20	Monastir, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
a9affbca-8d7e-46fc-84c3-d6f5907689de	Sonia Ayari	provider.mahdia@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000013	1998-09-21	Mahdia, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
deb7e2ed-aca0-49f0-8721-562d95649f9a	Wassim Miled	provider.sfax@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000014	1999-10-22	Sfax, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
b6d9038b-be6d-4a27-91ec-ae2c9acfb6af	Mouna Jebali	provider.kairouan@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000015	1978-11-23	Kairouan, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
8ec5bb9b-3946-4eb0-a405-1eaba5786cc6	Hichem Kacem	provider.kasserine@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000016	1979-12-24	Kasserine, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
88b1421b-66a0-428c-9d25-22a2c926cb8a	Olfa Beldi	provider.sidi.bouzid@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000017	1980-01-25	Sidi Bouzid, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
3b852976-4604-43e9-92a6-4849e04240f0	Rached Guesmi	provider.gabes@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000018	1981-02-26	Gabes, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
fc934708-a782-4a37-9d8a-679694e8d330	Dorra Triki	provider.medenine@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000019	1982-03-27	Medenine, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
8257ca94-3f92-4df5-964e-24bbce086ce5	Fethi Mabrouk	provider.tataouine@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000020	1983-04-01	Tataouine, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
de02e2b0-a179-4274-8c09-d7d5585a3f11	Yosra Lassoued	provider.gafsa@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000021	1984-05-02	Gafsa, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
ee49c626-86c1-4480-8ea5-29c1b616c1a5	Skander Neji	provider.tozeur@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000022	1985-06-03	Tozeur, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
35e2d806-cfe8-495c-88c2-35704af196aa	Maha Hajri	provider.kebili@sney3i.tn	$2b$10$TlwIE2bqFA3F7ROQkzPMMuf3sK2fyDesmS.9U5utaTwPdcuH8efAG	+2165000023	1986-07-04	Kebili, Tunisia	\N	prestataire	t	f	t	0	0	2026-05-03 22:36:22.935417	2026-05-03 22:36:22.935417	\N
3e151166-18fe-4030-8f9f-a2392a604645	Khalil Marzouki	applicant.tunis@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162900000	\N	Tunis, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.950846	2026-05-03 22:36:22.950846	\N
e6b095d5-e205-4c1c-b5f8-c00ee935ccc4	Ines Karray	applicant.sfax@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162900001	\N	Sfax, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.950846	2026-05-03 22:36:22.950846	\N
1256de4b-faf3-45c9-a4b7-4cb741c380c4	Maher Lahmar	applicant.sousse@sney3i.tn	$2b$10$TSZpqCt5RDu8ftVgGoVzxu8/4SxRCsw.gIokJzmVxeG31CZaeEYF6	+2162900002	\N	Sousse, Tunisia	\N	client	t	f	t	0	0	2026-05-03 22:36:22.950846	2026-05-03 22:36:22.950846	\N
\.


--
-- Name: email_tokens PK_08abb3fa348e894c274a6730d35; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_tokens
    ADD CONSTRAINT "PK_08abb3fa348e894c274a6730d35" PRIMARY KEY (id);


--
-- Name: admin_actions PK_08d0b319675c4968ff9e0dca4c3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT "PK_08d0b319675c4968ff9e0dca4c3" PRIMARY KEY (id);


--
-- Name: prestataire_profiles PK_0c65d38efb9343c01cffb5966c4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prestataire_profiles
    ADD CONSTRAINT "PK_0c65d38efb9343c01cffb5966c4" PRIMARY KEY (id);


--
-- Name: reviews PK_231ae565c273ee700b283f15c1d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY (id);


--
-- Name: categories PK_24dbc6126a28ff948da33e97d3b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: sous_categories PK_a6adaf29c854731fd0b0af7279c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sous_categories
    ADD CONSTRAINT "PK_a6adaf29c854731fd0b0af7279c" PRIMARY KEY (id);


--
-- Name: documents PK_ac51aa5181ee2036f5ca482857c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY (id);


--
-- Name: services PK_ba2d347a3168a296416c6c5ccb2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY (id);


--
-- Name: reports PK_d9013193989303580053c0b5ef6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY (id);


--
-- Name: service_requests PK_ee60bcd826b7e130bfbd97daf66; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT "PK_ee60bcd826b7e130bfbd97daf66" PRIMARY KEY (id);


--
-- Name: email_tokens UQ_78883008147dcc02eff941ed44d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_tokens
    ADD CONSTRAINT "UQ_78883008147dcc02eff941ed44d" UNIQUE (token);


--
-- Name: categories UQ_8b0be371d28245da6e4f4b61878; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE (name);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: reviews UQ_dfc145fb357dd8e9084f9de3699; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "UQ_dfc145fb357dd8e9084f9de3699" UNIQUE (service_request_id);


--
-- Name: prestataire_profiles UQ_f21f07ee7a124d821236d8d1813; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prestataire_profiles
    ADD CONSTRAINT "UQ_f21f07ee7a124d821236d8d1813" UNIQUE (user_id);


--
-- Name: email_tokens FK_018295f41628791c301bfe8b625; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_tokens
    ADD CONSTRAINT "FK_018295f41628791c301bfe8b625" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: service_requests FK_0f0523ef455e70bfe9a330342cc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT "FK_0f0523ef455e70bfe9a330342cc" FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports FK_1a88652537b43b16bf893febb7f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "FK_1a88652537b43b16bf893febb7f" FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;


--
-- Name: service_requests FK_1c2a35adb9aed8807aae3d51ee7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT "FK_1c2a35adb9aed8807aae3d51ee7" FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: services FK_5fefa379bf0f039cea1db84dadf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "FK_5fefa379bf0f039cea1db84dadf" FOREIGN KEY (sous_category_id) REFERENCES public.sous_categories(id) ON DELETE SET NULL;


--
-- Name: reports FK_628fb90b2d3a87f2bb236befa66; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "FK_628fb90b2d3a87f2bb236befa66" FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE SET NULL;


--
-- Name: documents FK_7e281648edb13a9cc989fcbe1c0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "FK_7e281648edb13a9cc989fcbe1c0" FOREIGN KEY (prestataire_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sous_categories FK_83b8139825c49e313532c589192; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sous_categories
    ADD CONSTRAINT "FK_83b8139825c49e313532c589192" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: admin_actions FK_8ad18c5e0eba9afc41934142289; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT "FK_8ad18c5e0eba9afc41934142289" FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports FK_9459b9bf907a3807ef7143d2ead; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead" FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: admin_actions FK_a350ec07c473eaff3c3596d602f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT "FK_a350ec07c473eaff3c3596d602f" FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: service_requests FK_c35fed1c4286bd6f1a547676e72; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT "FK_c35fed1c4286bd6f1a547676e72" FOREIGN KEY (prestataire_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: services FK_cadc77e857e870c94cd2f56316c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "FK_cadc77e857e870c94cd2f56316c" FOREIGN KEY (prestataire_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews FK_d4e7e923e6bb78a8f0add754493; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "FK_d4e7e923e6bb78a8f0add754493" FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews FK_dfc145fb357dd8e9084f9de3699; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "FK_dfc145fb357dd8e9084f9de3699" FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id) ON DELETE CASCADE;


--
-- Name: prestataire_profiles FK_f21f07ee7a124d821236d8d1813; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prestataire_profiles
    ADD CONSTRAINT "FK_f21f07ee7a124d821236d8d1813" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 7jJN1ltpIWBvLfAsQgyJgz5Hg8ebctaldHYeUu4ReoiBvDxQOxnM86e1lJk1uZQ
